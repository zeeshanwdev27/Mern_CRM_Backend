import User from '../models/User.js';
import Role from '../models/Role.js'
import Department from '../models/Department.js';



export const addUser = async (req, res) => {
    const { email, name, password, phone, role, department, status, joinDate } = req.body;

    // Validate required fields
    if (!email || !name || !password || !phone || !role || !department) {
        res.status(400);
        throw new Error('Please include all required fields');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already registered");
    }

    try {
        // Find the role document by name
        const roleDoc = await Role.findOne({ name: role });
        if (!roleDoc) {
            res.status(400);
            throw new Error(`Role '${role}' not found`);
        }

        // Find the department document by name
        const departmentDoc = await Department.findOne({ name: department });
        if (!departmentDoc) {
            res.status(400);
            throw new Error(`Department '${department}' not found`);
        }

        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: roleDoc._id,  // Use the ObjectId
            department: departmentDoc._id,  // Use the ObjectId
            status: status || 'Active',
            joinDate: joinDate || Date.now()
        });

        res.status(201).json({
            status: "success",
            message: "User successfully created",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: roleDoc.name,  // Send back the name for frontend
                department: departmentDoc.name,  // Send back the name for frontend
                status: user.status
            }
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || 'Invalid user data');
    }
};



export const allUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate("role")
            .populate("department");

        res.status(200).json({
            status: "success",
            message: "Users successfully fetched",
            data: users
        });
    } catch (error) {
        res.status(500);
        throw new Error('Failed to fetch users');
    }
};



export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            res.status(404);
            throw new Error('User not found');
        }

        res.status(200).json({
            status: "success",
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(400);
        throw new Error(error.message || 'Failed to delete user');
    }
};



// In your updateUser controller
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, role: roleName, department: departmentName, status, joinDate } = req.body;

    try {
        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Find role and department by name
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            res.status(400);
            throw new Error('Invalid role specified');
        }

        const department = await Department.findOne({ name: departmentName });
        if (!department) {
            res.status(400);
            throw new Error('Invalid department specified');
        }

        // Rest of your code remains the same, using role._id and department._id
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                name,
                email,
                phone,
                role: role._id,
                department: department._id,
                status: status || user.status,
                joinDate: joinDate || user.joinDate
            },
            { new: true, runValidators: true }
        ).select('-password').populate("role").populate("department");

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ error: error.message || 'User update failed' });
    }
};


export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('role')
            .populate('department');
        
        if (!user) {
            return res.status(404).json({ 
                status: "error",
                message: 'User not found' 
            });
        }

        res.status(200).json({
            status: "success",
            message: "User successfully fetched",
            data: user
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error",
            message: error.message || 'Failed to fetch user' 
        });
    }
};