import mongoose from "mongoose";
import Client from "../models/Clients.js";
import asyncHandler from "express-async-handler";

export const createClient = asyncHandler(async (req, res) => {
  const { name, email, company, projects, status, lastContact } = req.body;

  // Validate required fields
  if (!name || !email || !company) {
    res.status(400);
    throw new Error("Please fill all required fields: name, email, company");
  }

  // Validate projects
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    res.status(400);
    throw new Error("At least one project is required");
  }

  for (const project of projects) {
    if (!project.name || typeof project.value !== "number" || project.value < 0) {
      res.status(400);
      throw new Error("Each project must have a valid name and non-negative value");
    }
  }

  // Check for existing client
  const existingClient = await Client.findOne({ email });
  if (existingClient) {
    res.status(400);
    throw new Error("Client with this email already exists");
  }

  // Create new client
  const newClient = await Client.create({
    name,
    email,
    company,
    projects,
    status: status || "active",
    lastContact: lastContact || Date.now(),
  });

  res.status(201).json({
    status: "success",
    message: "Client created successfully",
    data: { client: newClient },
  });
});

export const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({});
  res.status(200).json({
    status: "success",
    message: "Clients fetched successfully",
    data: {
      getClients: clients,
    },
  });
});

export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid client ID format");
  }

  // Check if client exists
  const client = await Client.findById(id);
  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }

  // Perform deletion
  const deletedClient = await Client.findByIdAndDelete(id);
  
  res.status(200).json({
    status: "success",
    message: "Client deleted successfully",
    data: {
      id: deletedClient._id,
      name: deletedClient.name,
    },
  });
});

export const getSingleClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid client ID format");
  }

  const client = await Client.findById(id);

  if (!client) {
    res.status(404);
    throw new Error("Client not found");
  }

  res.status(200).json({
    status: "success",
    message: "Client retrieved successfully",
    data: {
      client,
    },
  });
});

export const updateClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate the ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid client ID");
  }

  const { name, email, company, projects, status, lastContact } = req.body;

  // Basic validation
  if (!name || !email || !company) {
    res.status(400);
    throw new Error("Please provide all required fields: name, email, company");
  }

  // Validate projects
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    res.status(400);
    throw new Error("At least one project is required");
  }

  for (const project of projects) {
    if (!project.name || typeof project.value !== "number" || project.value < 0) {
      res.status(400);
      throw new Error("Each project must have a valid name and non-negative value");
    }
  }

  // Update client
  const updatedClient = await Client.findByIdAndUpdate(
    id,
    {
      $set: {
        name,
        email,
        company,
        projects,
        status: status || 'active',
        lastContact: lastContact || new Date(),
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedClient) {
    res.status(404);
    throw new Error("Client not found");
  }

  res.status(200).json({
    status: "success",
    message: "Client updated successfully",
    data: {
      client: updatedClient,
    },
  });
});