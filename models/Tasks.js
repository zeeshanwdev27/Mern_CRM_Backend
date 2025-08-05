import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Task title cannot exceed 100 characters"]
    },
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
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "At least one assignee is required"],
      validate: {
        validator: async function(assignees) {
          if (!this.project) return true; // Skip if project not set yet
          const project = await mongoose.model("Project").findById(this.project);
          return assignees.every(assignee => 
            project.team && project.team.includes(assignee)
          );
        },
        message: "All assignees must be part of the project team"
      }
    }],
    tags: {
      type: [String],
      validate: {
        validator: function(tags) {
          return tags && tags.length > 0;
        },
        message: "At least one tag is required"
      }
    },
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

// Middleware to validate before saving
taskSchema.pre('save', async function(next) {
  if (this.isModified('assignees') || this.isModified('project')) {
    try {
      // Validate assignees are part of project team
      const project = await mongoose.model("Project").findById(this.project);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const invalidAssignees = this.assignees.filter(assignee => 
        !project.team.includes(assignee)
      );
      
      if (invalidAssignees.length > 0) {
        throw new Error(`Users ${invalidAssignees.join(', ')} are not part of the project team`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;