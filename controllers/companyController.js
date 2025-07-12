import asyncHandler from "express-async-handler";
import Company from "../models/Company.js"
import mongoose from "mongoose";

export const getName = asyncHandler(async (req, res) => {
  const company = await Company.findOne();

  if (!company) {
    throw new Error("Company name doesn't exist");
  }

  res.status(200).json({
    status: true,
    message: "Company name fetched successfully",
    data: company,
  });
});


export const updateName = asyncHandler(async(req,res)=>{

    const {id} = req.params
    const {name} = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error("Invalid contact ID format");
    }

    let company = await Company.findById(id)
    if(!company){
            return res.status(404).json({
            status: "error",
            message: "Company Name Not Found"
        });
    }

    // Update name and save
    company.name = name
    const updatedCompany  = await company.save()

    res.status(200).json({
        status: true,
        message: "Company Name updated successfully",
        data: updatedCompany
    })


})


export const createName = asyncHandler(async(req,res)=>{
    const {name} = req.body

    const company = await Company.create({
        name: name
    })

    res.status(200).json({
        status : 200,
        message: "Company Name Created Successfully",
        data: company
    })

})