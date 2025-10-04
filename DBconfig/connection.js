import mongoose from "mongoose";

export default mongoose.connect("mongodb+srv://Ameer:ameer114@cluster0.ferpypw.mongodb.net/cloudscart")
.then(()=>{
    console.log('DB Connected Successfully ! ');
})
.catch((err)=>{
    console.log('Failed to connect DB ! ',err)
})