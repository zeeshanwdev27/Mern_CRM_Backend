import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true
    },
    customInvoiceId: {
      type: String,
      trim: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client ID is required"]
    },
    invoiceDate: {
      type: Date,
      required: [true, "Invoice date is required"],
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Pending", "Paid", "Overdue"],
      default: "Pending"
    },
    items: [
      {
        projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
          required: [true, "Project ID is required"]
        },
        description: {
          type: String,
          required: [true, "Item description is required"],
          trim: true
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"]
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"]
        },
        taxRate: {
          type: Number,
          required: [true, "Tax rate is required"],
          min: [0, "Tax rate cannot be negative"],
          max: [100, "Tax rate cannot exceed 100%"]
        },
        amount: {
          type: Number,
          required: [true, "Amount is required"],
          min: [0, "Amount cannot be negative"]
        }
      }
    ],
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"]
    },
    tax: {
      type: Number,
      required: [true, "Tax amount is required"],
      min: [0, "Tax cannot be negative"]
    },
    taxRate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"]
    },
    total: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total cannot be negative"]
    },
    notes: {
      type: String,
      trim: true
    },
    terms: {
      type: String,
      trim: true,
      default: "Payment due within 30 days"
    },
    selectedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual population for client details
invoiceSchema.virtual("client", {
  ref: "Client",
  localField: "clientId",
  foreignField: "_id",
  justOne: true
});

// Add virtual population for project details
invoiceSchema.virtual("projects", {
  ref: "Project",
  localField: "selectedProjects",
  foreignField: "_id"
});

// Add pre-save hook to ensure amount calculations are correct
invoiceSchema.pre("save", function(next) {
  // Calculate amount for each item if not already set
  this.items.forEach(item => {
    if (!item.amount) {
      item.amount = item.quantity * item.price * (1 + (item.taxRate / 100));
    }
  });

  // Calculate totals if not already set
  if (!this.subtotal) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  if (!this.tax) {
    this.tax = this.items.reduce(
      (sum, item) => sum + (item.quantity * item.price * (item.taxRate / 100)),
      0
    );
  }

  if (!this.total) {
    this.total = this.subtotal + this.tax;
  }

  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;