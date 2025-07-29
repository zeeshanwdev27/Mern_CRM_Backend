import Project from "../models/Projects.js"
import asyncHandler from "express-async-handler";
import mongoose from "mongoose"
import Client from "../models/Clients.js"


export const getProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find()
        .populate({
            path: 'client',
            select: 'name projects',
            populate: {
                path: 'projects',
                select: 'name value' // Include any other fields you need from client projects
            }
        })
        .populate({
            path: 'clientProjects',
            select: 'name value' // Include any other fields you need from client projects
        })
        .lean(); // Convert to plain JavaScript objects

    // Transform the data structure for frontend
    const transformedProjects = projects.map(project => {
        // Get all client project names and values
        const clientProjectsDetails = project.clientProjects.map(cp => ({
            id: cp._id,
            name: cp.name,
            value: cp.value || 0
        }));

        return {
            _id: project._id,
            client: {
                _id: project.client?._id,
                name: project.client?.name || 'Unknown Client'
            },
            clientProjects: clientProjectsDetails,
            status: project.status,
            startDate: project.startDate,
            deadline: project.deadline,
            progress: project.progress,
            priority: project.priority,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };
    });

    res.json(transformedProjects);
});


export const createProject = asyncHandler(async (req, res) => {
    const {
        priority,
        client,
        clientProjects,  // Now an array of project IDs
        status,
        startDate,
        deadline,
    } = req.body;

    // Validate that at least one client project is selected
    if (!clientProjects || clientProjects.length === 0) {
        res.status(400);
        throw new Error("At least one client project must be selected");
    }

    // Validate deadline is after start date
    if (new Date(deadline) <= new Date(startDate)) {
        res.status(400);
        throw new Error("Deadline must be after start date");
    }

    // Verify all client projects belong to the specified client
    const clientDoc = await Client.findById(client);
    if (!clientDoc) {
        res.status(404);
        throw new Error("Client not found");
    }

    const invalidProjects = clientProjects.filter(projectId => 
        !clientDoc.projects.some(p => p._id.equals(projectId))
    );

    if (invalidProjects.length > 0) {
        res.status(400);
        throw new Error(`The following projects don't belong to the client: ${invalidProjects.join(', ')}`);
    }

    const newProject = new Project({
        priority,
        client,
        clientProjects,  // Array of project IDs
        status,
        startDate,
        deadline,
        progress: 0,  // Default to 0% progress for new projects
    });

    const savedProject = await newProject.save();
    
    // Optionally: Update client's projects with references to this project
    // await Client.findByIdAndUpdate(client, {
    //     $addToSet: { projects: { $each: clientProjects.map(pid => ({ _id: pid, project: savedProject._id })) }
    // });

    res.status(201).json({
        _id: savedProject._id,
        priority: savedProject.priority,
        client: savedProject.client,
        clientProjects: savedProject.clientProjects,
        status: savedProject.status,
        startDate: savedProject.startDate,
        deadline: savedProject.deadline,
        progress: savedProject.progress,
        createdAt: savedProject.createdAt,
    });
});


export const deleteProject = asyncHandler(async(req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

  const existProject = await Project.findById(id);

  if (!existProject) {
    res.status(404);
    throw new Error("Project doesn't exist");
  }

  await Project.findByIdAndDelete(id);
  
  res.status(200).json({
    status: "success",
    message: "Project successfully deleted"
  });
});


export const getSpecificProject = asyncHandler(async(req,res)=>{
  const {id} = req.params

    if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

    const response = await Project.findById(id);
  if (!response) {
    res.status(404);
    throw new Error("Project doesn't exist");
  }

  res.status(200).json({
    data : response
  })
})


export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid project ID format");
  }

  const existProject = await Project.findById(id);
  if (!existProject) {
    res.status(404);
    throw new Error("Project doesn't exist");
  }

  const { priority, client, clientProjects, status, startDate, deadline, progress } = req.body;

  // Convert dates and add buffer to deadline
  const start = new Date(startDate);
  let end = new Date(deadline);
  
  // Ensure deadline is at least 1ms after start date
  if (end <= start) {
    end = new Date(start.getTime() + 1);
  }

  // Verify client exists and get fresh data
  const clientDoc = await Client.findById(client).select('projects');
  if (!clientDoc) {
    res.status(404);
    throw new Error("Client not found");
  }

  // Validate client projects by string comparison
  const invalidProjects = [];
  const validProjects = [];

  for (const projectId of clientProjects) {
    const projectExists = clientDoc.projects.some(p => 
      String(p._id) === String(projectId)
    );

    if (projectExists) {
      validProjects.push(new mongoose.Types.ObjectId(projectId));
    } else {
      invalidProjects.push(projectId);
    }
  }

  if (invalidProjects.length > 0) {
    res.status(400);
    throw new Error(`Invalid client projects: ${invalidProjects.join(', ')}`);
  }

  // Perform update with disabled validation (we've already validated)
  const updatedProject = await Project.findByIdAndUpdate(
    id,
    {
      priority,
      client,
      clientProjects: validProjects,
      status: status === "on hold" ? "hold" : status,
      startDate: start,
      deadline: end,
      progress,
    },
    { 
      new: true,
      runValidators: false // We've done our own validation
    }
  ).populate('client', 'name')
   .populate('clientProjects', 'name');

  if (!updatedProject) {
    res.status(404);
    throw new Error("Project not found after update");
  }

  res.status(200).json({
    _id: updatedProject._id,
    client: updatedProject.client,
    clientProjects: updatedProject.clientProjects,
    priority: updatedProject.priority,
    status: updatedProject.status === "hold" ? "on hold" : updatedProject.status,
    startDate: updatedProject.startDate,
    deadline: updatedProject.deadline,
    progress: updatedProject.progress,
    createdAt: updatedProject.createdAt,
    updatedAt: updatedProject.updatedAt
  });
});