import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Client name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
    },
    projects: {
      type: [
        {
          name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
          },
          value: {
            type: Number, // Store as number for easier calculations
            required: [true, "Project value is required"],
            min: [0, "Project value cannot be negative"],
          },
        },
      ],
      required: [true, "At least one project is required"],
      validate: {
        validator: function (v) {
          return v.length > 0; // At least one project required
        },
        message: () => "At least one project is required",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastContact: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;