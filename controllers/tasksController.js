import Task from "../models/Tasks.js";
import Project from "../models/Projects.js";
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler';

// Helper function to transform task data
const transformTaskData = (task) => {
  return {
    ...task.toObject(),
    formattedStartDate: task.startDate.toISOString().split('T')[0],
    formattedDueDate: task.dueDate.toISOString().split('T')[0]
  };
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Project Manager)
export const createTask = asyncHandler(async (req, res) => {
  const { 
    title, 
    description, 
    status = 'Not Started',
    priority = 'Medium',
    startDate = new Date(),
    dueDate, 
    assignees, 
    tags,
    project
  } = req.body;

  // Validate required fields
  if (!title || !dueDate || !tags || !assignees || !project) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Validate project exists and user has access
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if current user is project manager or admin
  if (projectDoc.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to create tasks for this project');
  }

  try {
    const task = new Task({
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      assignees,
      tags,
      project,
      createdBy: req.user._id
    });

    const createdTask = await task.save();
    res.status(201).json(transformTaskData(createdTask));
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to create task: ${error.message}`);
  }
});

// @desc    Get all tasks (with filters)
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  try {
    // Build query based on user role and request params
    let query = {};
    
    // For non-admins, only show tasks they're assigned to or created
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignees: req.user._id },
        { createdBy: req.user._id }
      ];
    }

    // Apply project filter if provided
    if (req.query.project) {
      query.project = req.query.project;
    }

    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

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
      !task.assignees.some(a => a._id.equals(req.user._id)) && 
      !task.createdBy.equals(req.user._id)) {
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

  // Check if user is task creator or admin
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  const { 
    title, 
    description, 
    status, 
    priority, 
    startDate, 
    dueDate, 
    assignees, 
    tags 
  } = req.body;

  // Validate due date if provided
  if (dueDate) {
    const start = startDate ? new Date(startDate) : task.startDate;
    const due = new Date(dueDate);
    
    if (due <= start) {
      res.status(400);
      throw new Error('Due date must be after start date');
    }
    task.dueDate = due;
  }

  // Update fields if provided
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (startDate) task.startDate = new Date(startDate);
  if (tags) task.tags = tags;
  
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

  // Check if user is task creator or admin
  if (task.createdBy.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  await task.remove();
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