import Contact from "../models/Contact.js"
import asyncHandler from "express-async-handler";
import mongoose from "mongoose"


export const createContacts = asyncHandler( async(req,res)=>{
    let {name,email,phone,company,position,status='active',tags=[],starred=false} = req.body

    if(!name || !email || !phone || !company || !position){
        res.status(400)
        throw new Error ("Please Fill All Required Fields")
    }

    const existingContact = await Contact.findOne({email})
    if(existingContact){
        res.status(400)
        throw new Error("Contact Already Exists")
    }

    const contact = await Contact.create({
        name,
        email,
        phone,
        company,
        position,
        status,
        tags,
        starred,
        lastContact: new Date()
    })

    res.status(201).json({
        success: true,
        data: contact,
        message: "Contact Created Successfully",
    })

})

export const getContacts = asyncHandler( async(req,res)=>{

    const getContacts = await Contact.find({})
    res.status(200).json({
        status: "success",
        message: "Successfully Fetched All Contacts",
        getContacts
    })
})

export const deleteContacts = asyncHandler( async(req,res)=>{
    let {id} = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid contact ID format");
    }

    const deleteContact = await Contact.findByIdAndDelete(id)

    res.status(200).json({
        status: "success",
        message: "Contact Deleted Successfully",
        data : {
            deleteContact
        }
    })
})

export const updateStar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { starred } = req.body;

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid contact ID format");
  }

  const updatedContact = await Contact.findByIdAndUpdate(
    id,
    { starred },
    { new: true, runValidators: true }
  );

  if (!updatedContact) {
    res.status(404);
    throw new Error("Contact not found");
  }

  res.status(200).json({
    status: "success",
    message: "Star status updated",
    data: {
      contact: updatedContact
    }
  });
});


export const getSingleContact = asyncHandler(async (req, res) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400); 
        throw new Error("Invalid contact ID format");
    }

    const contact = await Contact.findById(id);

    if (!contact) {
        res.status(404); 
        throw new Error("Contact not found");
    }

    res.status(200).json({
        status: "success",
        message: "Contact retrieved successfully",
        data: {
            contact 
        }
    });
});


export const updateContact = asyncHandler(async (req, res) => {
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid contact ID format');
    }

    const existingContact = await Contact.findById(id);
    
    if (!existingContact) {
        res.status(404);
        throw new Error('Contact not found');
    }

    const {
        name,
        email,
        phone,
        company,
        position,
        status,
        tags,
        lastContact
    } = req.body;

    if (email && email !== existingContact.email) {
        const emailExists = await Contact.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already in use by another contact');
        }
    }

    const updateData = {
        name: name || existingContact.name,
        email: email || existingContact.email,
        phone: phone || existingContact.phone,
        company: company || existingContact.company,
        position: position || existingContact.position,
        status: status || existingContact.status,
        tags: tags || existingContact.tags,
        lastContact: lastContact || existingContact.lastContact
    };

    const updatedContact = await Contact.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedContact) {
        res.status(500);
        throw new Error('Failed to update contact');
    }

    res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        data: {
            contact: updatedContact
        }
    });
});