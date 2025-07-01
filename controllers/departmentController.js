import Department from "../models/Department.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose"

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.status(200).json({
      status: "success",
      message: "Departments successfully fetched",
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to fetch departments",
    });
  }
};


export const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, manager, isActive } = req.body;

  const departmentExists = await Department.findOne({ name });
  if (departmentExists) {
    res.status(400);
    throw new Error("Department Already Exists");
  }

  // create department
  const department = await Department.create({
    name,
    description,
    manager: manager || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    data: department,
  });
});


export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the ID format first
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid department ID format");
  }

  // Check if department exists
  const department = await Department.findById(id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  // Delete the department
  await Department.findByIdAndDelete(id);

  res.status(200).json({
    status: "success",
    message: "Department deleted successfully",
    data: null
  });
});