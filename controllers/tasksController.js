import Task from "../models/Tasks.js"
import mongoose from 'mongoose';


// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
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

  // Validate required fields
  if (!title || !dueDate || !tags || !assignees) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Validate assignees are valid ObjectIds
  if (!Array.isArray(assignees)) {
    res.status(400);
    throw new Error('Assignees must be an array');
  }

  for (const assigneeId of assignees) {
    if (!isValidObjectId(assigneeId)) {
      res.status(400);
      throw new Error('Invalid assignee ID format');
    }
  }

  // Validate due date is after start date
  const start = startDate ? new Date(startDate) : new Date();
  const due = new Date(dueDate);
  
  if (due <= start) {
    res.status(400);
    throw new Error('Due date must be after start date');
  }

  try {
    const task = new Task({
      title,
      description,
      status: status || 'Not Started',
      priority: priority || 'Medium',
      startDate: start,
      dueDate: due,
      assignees,
      tags
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400);
    throw new Error('Failed to create task');
  }
}

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignees", "name avatar role");
    res.json(tasks);
  } catch (error) {
    res.status(500);
    throw new Error('Server error while fetching tasks');
  }
}

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  const { id } = req.params;
  
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
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
    
    for (const assigneeId of assignees) {
      if (!isValidObjectId(assigneeId)) {
        res.status(400);
        throw new Error('Invalid assignee ID format');
      }
    }
    task.assignees = assignees;
  }

  try {
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400);
    throw new Error('Failed to update task');
  }
}

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task ID format' });
  }

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Delete Task Error:', error.message);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};


// @desc    Assign user to task
// @route   PATCH /api/tasks/:id/assign
// @access  Private
export const assignUser = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!isValidObjectId(id) || !isValidObjectId(userId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is already assigned
  if (task.assignees.includes(userId)) {
    res.status(400);
    throw new Error('User already assigned to this task');
  }

  task.assignees.push(userId);
  const updatedTask = await task.save();
  res.json(updatedTask);
}

// @desc    Unassign user from task
// @route   PATCH /api/tasks/:id/unassign
// @access  Private
export const unassignUser = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  if (!isValidObjectId(id) || !isValidObjectId(userId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if user is assigned
  if (!task.assignees.includes(userId)) {
    res.status(400);
    throw new Error('User not assigned to this task');
  }

  task.assignees = task.assignees.filter(assignee => assignee.toString() !== userId);
  const updatedTask = await task.save();
  res.json(updatedTask);
}

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid task ID format');
  }

  if (!['Not Started', 'In Progress', 'Completed', 'Blocked'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const task = await Task.findById(id);
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = status;
  const updatedTask = await task.save();
  res.json(updatedTask);
}
