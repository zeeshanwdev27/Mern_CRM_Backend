import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      default: "In Progress",
      enum: ["Not Started", "In Progress", "Completed", "Blocked"],
    },
    priority: {
      type: String,
      enum: ["High", "Low", "Medium"],
      default: "Medium",
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function () {
          return this.dueDate > this.startDate;
        },
        message: "Due date must be after start date",
      },
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    tags: {
      type: [String],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one tag is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
