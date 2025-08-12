import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true, _id: true });

const taskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      trim: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Blocked"],
      default: "Not Started"
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
      validate: {
        validator: async function() {
          const project = await mongoose.model("Project").findById(this.project);
          return this.startDate >= project.startDate;
        },
        message: "Start date cannot be before project start date"
      }
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: async function() {
          const project = await mongoose.model("Project").findById(this.project);
          return this.dueDate > this.startDate && 
                 (!project.deadline || this.dueDate <= project.deadline);
        },
        message: "Due date must be after start date and within project deadline"
      }
    },
    includeTime: {
      type: Boolean,
      default: false
    },
    assignees: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }],
      required: [true, "At least one assignee is required"],
      validate: {
        validator: async function(assignees) {
          if (!this.project) return true;
          const project = await mongoose.model("Project").findById(this.project).select('team');
          return assignees.every(assignee => 
            project.team.some(teamMember => teamMember.equals(assignee))
          );
        },
        message: "All assignees must be part of the project team"
      }
    },
  tags: {
    type: [String],
    required: false 
  },
    files: [fileSchema],
    completedAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted dates
taskSchema.virtual('formattedStartDate').get(function() {
  return this.startDate.toISOString().split('T')[0];
});

taskSchema.virtual('formattedDueDate').get(function() {
  return this.dueDate.toISOString().split('T')[0];
});

// Indexes for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });

// Middleware to ensure assignees is always an array
taskSchema.pre('save', function(next) {
  if (this.assignees && !Array.isArray(this.assignees)) {
    this.assignees = [this.assignees];
  }
  next();
});

// Clean up files when task is deleted
taskSchema.pre('remove', async function(next) {
  try {
    await Promise.all(this.files.map(async (file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }));
    next();
  } catch (error) {
    next(error);
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;