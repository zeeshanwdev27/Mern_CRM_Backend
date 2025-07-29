import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active'
    },
    joinDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastActive: {
      type: Date
    },
    profileImage: {
      type: String,
      default: 'default-profile.jpg'
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);


// Virtuals and methods remain the same

userSchema.virtual('formattedJoinDate').get(function() {
  return this.joinDate ? this.joinDate.toISOString().split('T')[0] : null;
});


// Projects Virtual field to show assigned project to user
userSchema.virtual('assignedProjects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'team',
});


// Tasks Virtual field to show assignee tasks to user
userSchema.virtual('assignedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'assignees',
});


// Encrypted Password Pre Method
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};




const User = mongoose.model('User', userSchema);
export default User;