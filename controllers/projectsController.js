import Project from "../models/Projects.js"
import asyncHandler from "express-async-handler";
import mongoose from "mongoose"


export const getProjects = asyncHandler(async(req,res)=>{
    const projects = await Project.find()
        .populate('client', 'name projects')
        .populate('team', 'name')
        .populate('clientProjectId', 'name projects');
    res.json(projects);
})


export const createProject = asyncHandler(async (req, res) => {
    const {
      priority,
      client,
      clientProjectId,
      status,
      team,
      startDate,
      deadline,
      progress,
    } = req.body;

    const newProject = new Project({
      priority,
      client,
      clientProjectId,
      status,
      team,
      startDate,
      deadline,
      progress,
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);

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

  const {
    priority,
    client,
    clientProjectId,
    status,
    team,
    startDate,
    deadline,
    progress,
  } = req.body;

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    {
      priority,
      client,
      clientProjectId,
      status,
      team,
      startDate,
      deadline,
      progress,
    },
    { new: true }
  );

  res.status(200).json(updatedProject);
});