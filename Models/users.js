import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String},
    address:{type:String},
    role:{type:String, enum:["user","seller","admin"], default:"user"}
})

const User=mongoose.model("User",userSchema);
export default User;