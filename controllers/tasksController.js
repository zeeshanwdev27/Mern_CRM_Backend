import Task from "../models/Tasks.js";
import Project from "../models/Projects.js";
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads/tasks');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed'), false);
  }
};

// Initialize multer with limits
export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});



// Helper function to transform task data
const transformTaskData = (task) => {
  const transformed = {
    ...task.toObject(),
    formattedStartDate: task.startDate.toISOString().split('T')[0],
    formattedDueDate: task.dueDate.toISOString().split('T')[0]
  };

  // Add file URLs if files exist
  if (task.files && task.files.length > 0) {
    transformed.files = task.files.map(file => ({
      ...file,
      url: `/api/tasks/${task._id}/files/${file._id}`
    }));
  }

  return transformed;
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager)
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager)
export const createTask = asyncHandler(async (req, res) => {
  try {
    // First ensure we have all required fields
    const requiredFields = ['description', 'dueDate', 'project'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      res.status(400);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate project exists and user has access
    const projectDoc = await Project.findById(req.body.project);
    if (!projectDoc) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Check authorization
    if (projectDoc.createdBy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to create tasks for this project');
    }

    // Process assignees - ensure it's an array
    let assignees = [];
    if (req.body.assignees) {
      assignees = Array.isArray(req.body.assignees) 
        ? req.body.assignees 
        : [req.body.assignees];
    }

    // Validate at least one assignee
    if (assignees.length === 0) {
      res.status(400);
      throw new Error('At least one assignee is required');
    }

    // Validate assignees are part of project team
    const invalidAssignees = assignees.filter(assigneeId => 
      !projectDoc.team.includes(assigneeId)
    );
    
    if (invalidAssignees.length > 0) {
      res.status(400);
      throw new Error(`Users ${invalidAssignees.join(', ')} are not part of the project team`);
    }

    // Process tags - ensure it's an array (but now optional)
    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : [req.body.tags];
    }
    // Removed: Validation for at least one tag

    // Parse dates based on includeTime
    const includeTime = req.body.includeTime || false;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const dueDate = new Date(req.body.dueDate);

    // If not including time, strip time components
    const parsedStartDate = includeTime 
      ? startDate 
      : new Date(startDate.setHours(0, 0, 0, 0));
    const parsedDueDate = includeTime 
      ? dueDate 
      : new Date(dueDate.setHours(0, 0, 0, 0));

    // Validate dates
    if (parsedDueDate <= parsedStartDate) {
      res.status(400);
      throw new Error('Due date must be after start date');
    }

    if (projectDoc.deadline && parsedDueDate > new Date(projectDoc.deadline)) {
      res.status(400);
      throw new Error('Due date must be within project deadline');
    }

    if (parsedStartDate < new Date(projectDoc.startDate)) {
      res.status(400);
      throw new Error('Start date cannot be before project start date');
    }

    // Create task data object
    const taskData = {
      description: req.body.description,
      status: req.body.status || 'Not Started',
      priority: req.body.priority || 'Medium',
      startDate: parsedStartDate,
      dueDate: parsedDueDate,
      assignees,
      project: req.body.project,
      includeTime,
      createdBy: req.user._id,
      files: req.files?.map(file => ({
        name: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: req.user._id
      })) || []
    };

    // Only add tags if they exist
    if (tags.length > 0) {
      taskData.tags = tags;
    }

    const task = new Task(taskData);
    const createdTask = await task.save();
    
    // Populate the assignees and createdBy fields for the response
    const populatedTask = await Task.findById(createdTask._id)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name');

    res.status(201).json(transformTaskData(populatedTask));
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      res.status(400);
      throw new Error(messages.join(', '));
    }
    
    // Handle other errors
    res.status(error.statusCode || 400);
    throw new Error(error.message || 'Failed to create task');
  }
});



// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  try {
    let query = {};
    
    // For non-admins, only show tasks they're assigned to or created
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignees: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    // Apply filters
    if (req.query.project) query.project = req.query.project;
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;

    const tasks = await Task.find(query)
      .populate("assignees", "name email role")
      .populate("project", "name client")
      .populate("createdBy", "name")
      .sort({ dueDate: 1 });

    res.json(tasks.map(task => transformTaskData(task)));
  } catch (error) {
    res.status(500);
    throw new Error('Server error while fetching tasks');
  }
});

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  const task = await Task.findById(id)
    .populate("assignees", "name email role")
    .populate("project", "name client")
    .populate("createdBy", "name");

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check access rights
  if (req.user.role !== 'admin' && 
      !task.assignees.some(a => a._id.equals(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to access this task');
  }

  res.json(transformTaskData(task));
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Project Manager)
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  const task = await Task.findById(id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check authorization
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const { 
    description, 
    status, 
    priority, 
    startDate, 
    dueDate, 
    assignees, 
    tags,
    includeTime
  } = req.body;

  // Update fields if provided
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (includeTime !== undefined) task.includeTime = includeTime;

  // Handle dates
  if (startDate) {
    task.startDate = task.includeTime ? new Date(startDate) : new Date(new Date(startDate).setHours(0, 0, 0, 0));
  }
  if (dueDate) {
    const newDueDate = task.includeTime ? new Date(dueDate) : new Date(new Date(dueDate).setHours(0, 0, 0, 0));
    if (newDueDate <= task.startDate) {
      res.status(400);
      throw new Error('Due date must be after start date');
    }
    task.dueDate = newDueDate;
  }

  // Update tags if provided
  if (tags) {
    task.tags = Array.isArray(tags) ? tags : [tags];
  }

  // Update assignees if provided
  if (assignees) {
    if (!Array.isArray(assignees)) {
      res.status(400);
      throw new Error('Assignees must be an array');
    }
    
    // Validate assignees are part of project team
    const project = await Project.findById(task.project);
    const invalidAssignees = assignees.filter(assigneeId => 
      !project.team.includes(assigneeId)
    );
    
    if (invalidAssignees.length > 0) {
      res.status(400);
      throw new Error(`Users ${invalidAssignees.join(', ')} are not part of the project team`);
    }
    
    task.assignees = assignees;
  }

  task.lastUpdatedBy = req.user._id;

  try {
    const updatedTask = await task.save();
    res.json(transformTaskData(updatedTask));
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to update task: ${error.message}`);
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Project Manager)
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  const task = await Task.findById(id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check authorization
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  // First, delete associated files
  if (task.files && task.files.length > 0) {
    task.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Delete the file from storage
      }
    });
  }

  // Use deleteOne() instead of remove()
  await Task.deleteOne({ _id: id });
  
  res.json({ message: 'Task removed successfully' });
});

// @desc    Assign user to task
// @route   PATCH /api/tasks/:id/assign
// @access  Private (Project Manager)
export const assignUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const task = await Task.findById(id).populate('project');
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check authorization
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to modify this task');
  }

  // Check if user is part of project team
  if (!task.project.team.includes(userId)) {
    res.status(400);
    throw new Error('User is not part of the project team');
  }

  // Check if user is already assigned
  if (task.assignees.includes(userId)) {
    res.status(400);
    throw new Error('User already assigned to this task');
  }

  task.assignees.push(userId);
  task.lastUpdatedBy = req.user._id;
  const updatedTask = await task.save();
  res.json(transformTaskData(updatedTask));
});

// @desc    Unassign user from task
// @route   PATCH /api/tasks/:id/unassign
// @access  Private (Project Manager)
export const unassignUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check authorization
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to modify this task');
  }

  // Check if user is assigned
  if (!task.assignees.includes(userId)) {
    res.status(400);
    throw new Error('User not assigned to this task');
  }

  task.assignees = task.assignees.filter(assignee => assignee.toString() !== userId);
  task.lastUpdatedBy = req.user._id;
  const updatedTask = await task.save();
  res.json(transformTaskData(updatedTask));
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Assigned User or Project Manager)
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  const validStatuses = ['Not Started', 'In Progress', 'Completed', 'Blocked'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is assigned to task or is project manager/admin
  const isAssigned = task.assignees.some(a => a.equals(req.user._id));
  const isCreator = task.createdBy.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';
  
  if (!isAssigned && !isCreator && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  task.status = status;
  if (status === 'Completed') {
    task.completedAt = new Date();
  } else {
    task.completedAt = null;
  }
  task.lastUpdatedBy = req.user._id;

  const updatedTask = await task.save();
  res.json(transformTaskData(updatedTask));
});



export const downloadFile = asyncHandler(async (req, res) => {
  const { id, fileId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(fileId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const task = await Task.findById(id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check authorization
  if (req.user.role !== 'admin' && 
      !task.assignees.some(a => a.equals(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to access this file');
  }

  const file = task.files.id(fileId);
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  if (!fs.existsSync(file.path)) {
    res.status(404);
    throw new Error('File not found on server');
  }

  res.download(file.path, file.name);
});