import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"], // Fixed typo: maxlenght -> maxlength
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [50, "Company Name cannot exceed 50 characters"], // Fixed typo
    },
    position: {
      type: String,
      required: [true, "Position name is required"],
      trim: true,
      maxlength: [50, "Position name cannot exceed 50 characters"], // Fixed typo
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\+?[0-9\s\-().]{7,20}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
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
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 5; // Example: Limit to 5 tags max
        },
        message: "Cannot have more than 5 tags",
      },
    },
    starred: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
