import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      // enum: ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Support', 'HR', 'Admin'],
      default: 'Engineering'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for department members
departmentSchema.virtual('members', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  justOne: false
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;