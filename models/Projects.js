import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      required: true,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    clientProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        validate: {
          validator: async function (value) {
            if (!this.client) return false;

            // Skip validation during update - we handle it in controller
            if (this.isModified() && this.isModified("clientProjects")) {
              return true;
            }

            const client = await mongoose
              .model("Client")
              .findById(this.client)
              .select("projects");

            if (!client) return false;

            return client.projects.some((p) => String(p._id) === String(value));
          },
          message: (props) =>
            `Project ${props.value} does not belong to the client`,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["active", "hold", "completed"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // Skip validation during update - we handle it in controller
          if (this.isModified() && this.isModified("deadline")) {
            return true;
          }
          return value > this.startDate;
        },
        message: "Deadline must be after start date",
      },
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ deadline: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
