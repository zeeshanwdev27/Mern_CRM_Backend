import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "high",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      validate: {
        validator: async function (value) {
          const client = await mongoose.model("Client").findById(this.client);
          return (
            client &&
            client.projects.some((project) => project._id.equals(value))
          );
        },
        message: "Invalid client project ID",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "hold", "completed"],
      default: "active",
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator: function () {
          return this.deadline > this.startDate;
        },
        message: "Deadline must be after start date",
      },
    },
    progress: {
      type: Number,
      required: true,
      default: 10,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;