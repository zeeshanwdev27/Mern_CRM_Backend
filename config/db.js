import mongoose from "mongoose"

const connectDb = async ()=> {
    try{
        const conn = await mongoose.connect("mongodb://127.0.0.1:27017/CrmApp");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch(e){
        console.error(`Mongodb Connection Error: ${e.message}`);
        process.exit(1)
    }
}


export default connectDb