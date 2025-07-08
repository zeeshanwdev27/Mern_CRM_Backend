import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js"
import Client  from "../models/Clients.js";
import mongoose  from "mongoose";

const addInvoice = asyncHandler(async (req, res) => {
  const {
    clientId,
    invoiceDate,
    dueDate,
    status,
    items,
    notes,
    terms,
    customInvoiceId,
    taxRate
  } = req.body;

  // Validate required fields
  if (!clientId || !invoiceDate || !dueDate || !items || items.length === 0) {
    res.status(400);
    throw new Error("Please provide all required fields (clientId, invoiceDate, dueDate, items)");
  }

  // Check if client exists
  const clientExists = await Client.findById(clientId);
  if (!clientExists) {
    res.status(404);
    throw new Error("Client not found");
  }

  // Validate items
  for (const item of items) {
    if (!item.projectId || !item.description || !item.quantity || !item.price || item.taxRate === undefined) {
      res.status(400);
      throw new Error("Each item must have projectId, description, quantity, price, and taxRate");
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Generate invoice number if not provided
  let invoiceNumber;
  if (customInvoiceId) {
    invoiceNumber = customInvoiceId;
    
    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      res.status(400);
      throw new Error("Invoice number already exists");
    }
  } else {
    // Generate auto invoice number (CLIENT-YYYY-001 format)
    const clientPrefix = clientExists.company.substring(0, 4).toUpperCase();
    const year = new Date().getFullYear();
    
    // Find the last invoice for this client in this year
    const lastInvoice = await Invoice.findOne({
      clientId,
      invoiceNumber: new RegExp(`^${clientPrefix}-${year}-`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSeq + 1;
    }
    
    invoiceNumber = `${clientPrefix}-${year}-${sequence.toString().padStart(3, '0')}`;
  }

  // Create the invoice
  const invoice = await Invoice.create({
    clientId,
    invoiceNumber,
    customInvoiceId: customInvoiceId || null,
    invoiceDate: new Date(invoiceDate),
    dueDate: new Date(dueDate),
    status,
    items: items.map(item => ({
      ...item,
      amount: item.quantity * item.price * (1 + (item.taxRate / 100))
    })),
    subtotal,
    tax,
    taxRate,
    total,
    notes,
    terms,
    selectedProjects: items.map(item => item.projectId)
  });

  // Update client's lastContact date
  await Client.findByIdAndUpdate(clientId, {
    lastContact: new Date()
  });

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: {
      invoice
    }
  });
});


const getInvoices = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  
  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Filter by client ID if provided
  if (req.query.clientId) {
    filter.clientId = req.query.clientId;
  }
  
  // Date range filtering
  if (req.query.startDate || req.query.endDate) {
    filter.invoiceDate = {};
    if (req.query.startDate) {
      filter.invoiceDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.invoiceDate.$lte = new Date(req.query.endDate);
    }
  }
  
  // Search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { invoiceNumber: searchRegex },
      { customInvoiceId: searchRegex }
    ];
    
    // If you want to search by client name, you'll need to:
    // 1. First find clients matching the search
    // 2. Then use their IDs in the invoice filter
    const matchingClients = await Client.find({
      $or: [
        { name: searchRegex },
        { company: searchRegex }
      ]
    }).select('_id');
    
    if (matchingClients.length > 0) {
      filter.$or.push({ clientId: { $in: matchingClients.map(c => c._id) } });
    }
  }

  // Sorting
  const sortOptions = {};
  if (req.query.sortBy) {
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    sortOptions[req.query.sortBy] = sortOrder;
  } else {
    sortOptions.createdAt = -1; // Default sort by newest first
  }

  // Get invoices with populated data
  const invoices = await Invoice.find(filter)
    .populate({
      path: 'clientId',
      select: 'name email company' // Only include these fields
    })
    .populate({
      path: 'selectedProjects',
      select: 'name description value' // Project details
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  // Count total invoices for pagination
  const totalInvoices = await Invoice.countDocuments(filter);
  const totalPages = Math.ceil(totalInvoices / limit);

  // Format response
  const response = {
    success: true,
    count: invoices.length,
    page,
    totalPages,
    totalInvoices,
    data: invoices.map(invoice => ({
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customInvoiceId: invoice.customInvoiceId,
      client: invoice.clientId ? {
        id: invoice.clientId._id,
        name: invoice.clientId.name,
        email: invoice.clientId.email,
        company: invoice.clientId.company
      } : null,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      taxRate: invoice.taxRate,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      projects: invoice.selectedProjects.map(project => ({
        id: project._id,
        name: project.name,
        description: project.description,
        value: project.value
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }))
  };

  res.json(response);
});


const deleteInvoice = asyncHandler(async(req,res)=>{
    const {id} = req.params
    console.log(id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid invoice ID format');
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }

    await Invoice.findByIdAndDelete(id)

    res.status(200).json({
        success: true,
        message: "Invoice Successfully Deleted"
    })
})


const markAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid invoice ID format');
  }

  try {
    // Find the invoice first to check current status
    const invoice = await Invoice.findById(id);
    
    if (!invoice) {
      res.status(404);
      throw new Error('Invoice not found');
    }

    // Check if already paid
    if (invoice.status === 'Paid') {
      return res.status(200).json({
        success: true,
        message: "Invoice was already marked as paid",
        data: invoice
      });
    }

    // Update only the status field
    invoice.status = 'Paid';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Invoice status updated to paid",
      data: invoice
    });

  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500);
    throw new Error('Failed to update invoice status');
  }
});

const getInvoiceForPrinting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid invoice ID format');
  }

  const invoice = await Invoice.findById(id)
    .populate({
      path: 'clientId',
      select: 'name email company address city state zip country phone'
    })
    .populate({
      path: 'selectedProjects',
      select: 'name description'
    })
    .populate({
      path: 'items.projectId',
      select: 'name description'
    });

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  res.status(200).json({
    success: true,
    data: {
      id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.clientId,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      status: invoice.status,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      taxRate: invoice.taxRate,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      projects: invoice.selectedProjects
    }
  });
});



export { addInvoice, getInvoices, deleteInvoice, markAsPaid, getInvoiceForPrinting};