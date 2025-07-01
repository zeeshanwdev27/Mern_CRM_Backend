import Role from '../models/Role.js';
import Department from "../models/Department.js"


export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}).populate("department")
        res.status(200).json({
            status: "success",
            message: "Roles successfully fetched",
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || 'Failed to fetch roles'
        });
    }
};

export const getRoleById = async(req,res)=>{
    try{
        const {id} = req.params
        const roles = await Role.findById(id).populate("department")

        // console.log(roles);
        
        if(!roles){
            res.status(404).json({
                status: "error",
                message: "Role Not Found"
            })
        }

        res.status(201).json({
            status: "success",
            message: "Role Found Successfully",
            roles
        })

    }catch(e){
        res.status(500).json({
            status: "error",
            message: "Error Role Not Found" || e.message
        })

    }
}


export const deleteRole = async (req, res) => {
    const { id } = req.params;

    try {
        // First check if the role exists and is a system role
        const role = await Role.findById(id);
        
        if (!role) {
            return res.status(404).json({
                status: "error",
                message: "Role not found"
            });
        }

        if (role.isDefault) {
            return res.status(400).json({
                status: "error",
                message: "System roles cannot be deleted"
            });
        }

        // If checks pass, delete the role
        await Role.findByIdAndDelete(id);

        res.status(200).json({
            status: "success",
            message: "Role deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || 'Failed to delete role'
        });
    }
};


export const createRole = async(req,res)=>{

    try{
        const { name, description, department, permissions } = req.body;

        if(!name){
            return res.status(400).json({ message: "Role Name Is Required"})
        }

        const roleExists = await Role.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        })

        if(roleExists){
            return res.status(400).json({message: `Role "${roleExists.name}" already Exists`})
        }

        if(department){
            const deptExists = await Department.findById(department)
            if(!deptExists){
                return res.status(400).json({message: "Department Not Found"})
            }
        }

        const role = new Role({
            name: name.trim(),
            description: description?.trim(),
            department: department || undefined,
            permissions: permissions || []
        })

        const createdRole = await role.save()
        res.status(201).json(createRole)

    }catch(error){
        res.status(500).json({
            message: "Server Error Creating Role",
            error: error.message 
        })

    }

}


export const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, description, department, permissions } = req.body;

    try {
        const role = await Role.findById(id);
        
        if (!role) {
            return res.status(404).json({
                status: "error",
                message: "Role not found"
            });
        }

        if (role.isDefault) {
            return res.status(400).json({
                status: "error",
                message: "System roles cannot be modified"
            });
        }

        // Check if department exists if provided
        if (department) {
            const deptExists = await Department.findById(department);
            if (!deptExists) {
                return res.status(400).json({ message: "Department not found" });
            }
        }

        // Update role fields
        role.name = name || role.name;
        role.description = description || role.description;
        role.department = department || role.department;
        role.permissions = permissions || role.permissions;

        const updatedRole = await role.save();

        res.status(200).json({
            status: "success",
            message: "Role updated successfully",
            data: updatedRole
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message || 'Failed to update role'
        });
    }
};