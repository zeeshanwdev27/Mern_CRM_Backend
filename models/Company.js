import mongoose from "mongoose";


let companyschema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    }
},
{ timestamps: true })


let Company = mongoose.model("Company", companyschema)


export default Company