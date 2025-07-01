import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      // enum: ['Developer', 'Designer', 'Project Manager', 'QA Engineer', 'Marketing', 'Sales', 'Administrator'],
      default: 'Developer'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    permissions: {
      type: [String],
      default: [],
      enum: [
        'create', 'read', 'update', 'delete',
        'manage_users', 'manage_roles', 'manage_departments',
        'approve_content', 'view_reports', 'export_data'
      ]
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for users with this role
roleSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  justOne: false
});

const Role = mongoose.model('Role', roleSchema);
export default Role;