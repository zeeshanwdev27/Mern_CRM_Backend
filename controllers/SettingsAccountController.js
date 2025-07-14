import asyncHandler from "express-async-handler";
import User from "../models/User.js"


export const getAdminData = asyncHandler(async (req, res) => {
    
  const admin = await User.findOne({ name: "System Admin" })
    .populate("role")
    .select("-password"); 

  if (!admin) {
    throw new Error("Admin user not found");
  }

  if (admin.role?.name !== "Administrator") { 
    throw new Error("User does not have admin role");
  }

  res.json({
    status: "success",
    data: {
      email: admin.email,
      role: admin.role.name,
    }
  });
});

export const updateAdminAccount = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, email } = req.body;
  const admin = await User.findById(req.user._id).select("+password");

  // Verify current password if changing password or email
  if (newPassword || (email && email !== admin.email)) {
    if (!currentPassword) {
      throw new Error("Current password is required for security verification");
    }
    
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) throw new Error("Current password is incorrect");
  }

  // Update email if changed
  if (email && email !== admin.email) {
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new Error("Email already in use");
    }
    admin.email = email;
  }

  // Update password if changed
  if (newPassword) {
    admin.password = newPassword; // Will be hashed by pre-save hook
  }

  await admin.save();

  // Return updated data (excluding sensitive fields)
  const updatedAdmin = await User.findById(req.user._id)
    .select("-password")
    .populate("role");

  res.json({
    success: true,
    message: "Account updated successfully",
    data: {
      email: updatedAdmin.email,
      role: updatedAdmin.role.name
    }
  });
});