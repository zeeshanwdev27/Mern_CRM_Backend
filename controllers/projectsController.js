import Project from "../models/Projects.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Client from "../models/Clients.js";
import User from "../models/User.js";

// Helper function to transform project data
const transformProjectData = (project) => {
  const clientProjectsDetails = project.clientProjects.map(cp => ({
    id: cp._id,
    name: cp.name,
    value: cp.value || 0
  }));

  return {
    _id: project._id,
    name: project.name,
    description: project.description,
    client: {
      _id: project.client?._id,
      name: project.client?.name || 'Unknown Client'
    },
    clientProjects: clientProjectsDetails,
    team: project.team || [],
    status: project.status === "hold" ? "on hold" : project.status,
    startDate: project.startDate,
    deadline: project.deadline,
    progress: project.progress,
    priority: project.priority,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
};

// Get all projects
export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find()
    .populate('client', 'name')
    .populate('clientProjects', 'name value')
    .populate('team', 'name role')
    .lean();

  res.json(projects.map(transformProjectData));
});

// Create new project

export const createProject = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    priority,
    client,
    clientProjects,
    status,
    startDate,
    deadline,
    team = [] // Default empty team
  } = req.body;

  // Basic validations
  if (!name) {
    res.status(400);
    throw new Error("Project name is required");
  }

  if (!clientProjects?.length) {
    res.status(400);
    throw new Error("At least one client project must be selected");
  }

  // Validate client exists
  const clientDoc = await Client.findById(client);
  if (!clientDoc) {
    res.status(404);
    throw new Error("Client not found");
  }

  // Validate client projects
  const invalidProjects = clientProjects.filter(projectId => 
    !clientDoc.projects.some(p => p._id.equals(projectId))
  );

  if (invalidProjects.length > 0) {
    res.status(400);
    throw new Error(`Invalid client projects: ${invalidProjects.join(', ')}`);
  }

  // Validate team members (if any)
  if (team.length > 0) {
    const users = await User.find({ _id: { $in: team }});
    const inactiveUsers = users.filter(u => u.status !== 'Active');
    if (inactiveUsers.length > 0) {
      res.status(400);
      throw new Error(`Cannot add inactive users: ${inactiveUsers.map(u => u._id).join(', ')}`);
    }
  }

  // Create project
  const newProject = new Project({
    name,
    description,
    priority,
    client,
    clientProjects,
    team,
    status,
    startDate,
    deadline,
    progress: 0,
    createdBy: req.user._id
  });

  const savedProject = await newProject.save();
  res.status(201).json(transformProjectData(savedProject));
});

// Get specific project
export const getSpecificProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

  const project = await Project.findById(id)
    .populate('client', 'name')
    .populate('team', 'name email role status')
    .populate('createdBy', 'name')
    .lean();

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Get the client to access its projects array
  const client = await Client.findById(project.client)
    .select('projects')
    .lean();

  // Map the clientProjects to include the actual project data
  const clientProjectsWithDetails = project.clientProjects.map(cpId => {
    const clientProject = client.projects.find(p => p._id.equals(cpId));
    return {
      _id: cpId,
      name: clientProject?.name || 'Unknown Project',
      value: clientProject?.value || 0
    };
  });

  const transformedProject = {
    ...project,
    status: project.status === "hold" ? "on hold" : project.status,
    team: project.team || [],
    clientProjects: clientProjectsWithDetails
  };

  res.status(200).json(transformedProject);
});

// Update project
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

  const project = await Project.findById(id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const { 
    name,
    description,
    priority, 
    client, 
    clientProjects, 
    status, 
    startDate, 
    deadline, 
    progress 
  } = req.body;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(deadline);
  if (end <= start) {
    res.status(400);
    throw new Error("Deadline must be after start date");
  }

  // Validate client projects if being updated
  if (clientProjects) {
    const clientDoc = await Client.findById(client).select('projects');
    if (!clientDoc) {
      res.status(404);
      throw new Error("Client not found");
    }

    const invalidProjects = clientProjects.filter(projectId => 
      !clientDoc.projects.some(p => p._id.equals(projectId))
    );

    if (invalidProjects.length > 0) {
      res.status(400);
      throw new Error(`Invalid client projects: ${invalidProjects.join(', ')}`);
    }
  }

  // Update project
  const updatedProject = await Project.findByIdAndUpdate(
    id,
    {
      name,
      description,
      priority,
      client,
      clientProjects,
      status: status === "on hold" ? "hold" : status,
      startDate: start,
      deadline: end,
      progress,
      lastUpdatedBy: req.user._id
    },
    { new: true }
  )
  .populate('client', 'name')
  .populate('clientProjects', 'name value')
  .populate('team', 'name role');

  res.status(200).json(transformProjectData(updatedProject));
});

// Delete project
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

  const project = await Project.findByIdAndDelete(id);
  
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.status(200).json({
    status: "success",
    message: "Project deleted successfully"
  });
});

// Add team members to project
export const addTeamMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;

  if (!userIds?.length) {
    res.status(400);
    throw new Error("At least one user ID is required");
  }

  // Validate users exist and are active
  const users = await User.find({ 
    _id: { $in: userIds },
    status: 'Active'
  });

  if (users.length !== userIds.length) {
    const foundIds = users.map(u => u._id.toString());
    const missingIds = userIds.filter(id => !foundIds.includes(id));
    res.status(400);
    throw new Error(`Invalid or inactive users: ${missingIds.join(', ')}`);
  }

  // Add to project team (avoid duplicates)
  const project = await Project.findByIdAndUpdate(
    id,
    {
      $addToSet: { team: { $each: userIds } }
    },
    { new: true }
  ).populate('team', 'name role');

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.status(200).json({
    team: project.team,
    message: "Team members added successfully"
  });
});

// Remove team member from project
export const removeTeamMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findByIdAndUpdate(
    id,
    {
      $pull: { team: userId }
    },
    { new: true }
  ).populate('team', 'name role');

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  res.status(200).json({
    team: project.team,
    message: "Team member removed successfully"
  });
});