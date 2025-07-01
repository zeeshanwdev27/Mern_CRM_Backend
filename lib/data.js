import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import bcrypt from "bcryptjs";

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/CrmApp");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

async function setupAdminRoleAndDepartment() {
  // First create all departments
  const departments = [
    {
      name: "Engineering",
      description: "Engineering department for developers and QA",
      isActive: true,
    },
    {
      name: "Design",
      description: "Design department for UI/UX designers",
      isActive: true,
    },
    {
      name: "Product",
      description: "Product management department",
      isActive: true,
    },
    {
      name: "Marketing",
      description: "Marketing and promotions department",
      isActive: true,
    },
    {
      name: "Sales",
      description: "Sales and client management department",
      isActive: true,
    },
    {
      name: "Support",
      description: "Customer support department",
      isActive: true,
    },
    {
      name: "HR",
      description: "Human resources department",
      isActive: true,
    },
    {
      name: "Admin",
      description: "Admin department for administrators",
      isActive: true,
    },
  ];

  // Create or update departments
  const createdDepartments = [];
  for (const dept of departments) {
    let existingDept = await Department.findOne({ name: dept.name });
    if (!existingDept) {
      existingDept = await Department.create(dept);
      console.log(`${dept.name} department created`);
    } else {
      console.log(`${dept.name} department already exists`);
    }
    createdDepartments.push(existingDept);
  }

  // Now create roles with department associations
  const roles = [
    {
      name: "Developer",
      description: "Developer with access to development tasks",
      permissions: ["create", "read", "update", "delete"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Engineering")._id
    },
    {
      name: "Designer",
      description: "Designer with access to design tasks",
      permissions: ["create", "read", "update"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Design")._id
    },
    {
      name: "Project Manager",
      description: "Manages projects and team coordination",
      permissions: ["read", "update", "approve_content", "view_reports"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Product")._id
    },
    {
      name: "QA Engineer",
      description: "Quality assurance and testing",
      permissions: ["read", "update", "view_reports"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Engineering")._id
    },
    {
      name: "Marketing",
      description: "Handles marketing campaigns",
      permissions: ["create", "read", "update", "approve_content"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Marketing")._id
    },
    {
      name: "Sales",
      description: "Manages sales and client relations",
      permissions: ["read", "update", "export_data"],
      isDefault: false,
      department: createdDepartments.find(d => d.name === "Sales")._id
    },
    {
      name: "Administrator",
      description: "System administrator with full access",
      permissions: [
        "create",
        "read",
        "update",
        "delete",
        "manage_users",
        "manage_roles",
        "manage_departments",
        "approve_content",
        "view_reports",
        "export_data",
      ],
      isDefault: true,
      department: createdDepartments.find(d => d.name === "Admin")._id
    },
  ];

  // Create or update roles
  const createdRoles = [];
  for (const role of roles) {
    let existingRole = await Role.findOne({ name: role.name });
    if (!existingRole) {
      existingRole = await Role.create(role);
      console.log(`${role.name} role created`);
    } else {
      // Update existing role with department if not set
      if (!existingRole.department) {
        existingRole.department = role.department;
        await existingRole.save();
        console.log(`${role.name} role updated with department`);
      } else {
        console.log(`${role.name} role already exists with department`);
      }
    }
    createdRoles.push(existingRole);
  }

  // Find admin role and department for the admin user
  const adminRole = createdRoles.find((role) => role.name === "Administrator");
  const adminDepartment = createdDepartments.find(
    (dept) => dept.name === "Admin"
  );

  return { adminRole, adminDepartment };
}

async function createAdminUser(adminRole, adminDepartment) {
  try {
    // Check if admin already exists
    const existAdmin = await User.findOne({ email: "admin123@gmail.com" });
    if (existAdmin) {
      console.log("Admin already registered");
      return;
    }

    console.log(`Here is Admin Role ${adminRole}, Here is Admin Department ${adminDepartment} which stores in DB`);

    // Create admin user
    const adminUser = new User({
      name: "System Admin",
      email: "admin123@gmail.com",
      password: "admin123", // Will be hashed by pre-save hook
      phone: "+10000000000",
      role: adminRole._id,
      department: adminDepartment._id,
      status: "Active",
      isVerified: true,
      profileImage: "default-admin.jpg",
    });

    await adminUser.save();

    // Update department manager if needed
    if (!adminDepartment.manager) {
      adminDepartment.manager = adminUser._id;
      await adminDepartment.save();
    }

    console.log("Admin successfully created:");
    console.log(`Email: admin123@gmail.com`);
    console.log(`Password: admin123`);
    console.log("Please change this password immediately after first login!");
  } catch (e) {
    console.error("Error creating admin user:", e);
  }
}

async function main() {
  try {
    await connectDB();

    // Setup all roles and departments, and get admin role/department
    const { adminRole, adminDepartment } = await setupAdminRoleAndDepartment();

    // Create admin user
    await createAdminUser(adminRole, adminDepartment);
  } catch (e) {
    console.error("Error in main execution:", e);
  } finally {
    mongoose.connection.close();
  }
}

main();