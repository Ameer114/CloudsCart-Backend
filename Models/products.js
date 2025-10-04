import mongoose from "mongoose";

const productsSchema=new mongoose.Schema({
title:{type:String, required:true, maxlength:100},
description:{type:String, required:true, minlength:50},
seller:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
category:{type:mongoose.Schema.Types.ObjectId, ref:"Category", required:true},
price:{type:Number, required:true, min:0},
stock:{type:Number, required:true, min:0},
images:{type:[String], required:true},
reviews:{type:[{user:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
                rate:{type:Number, required:true, min:0},
                comment:{type:String}}]}
})

const Products=mongoose.model("Products",productsSchema);

export default Products