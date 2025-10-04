import mongoose from "mongoose"

const orderSchema=new mongoose.Schema({
    user:{type: mongoose.Schema.Types.ObjectId, ref:"User", required:true},
        products:[
            {
                productId:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Products",
                    required:true
                },
                quantity:{type:Number, required:true, min:1, default:1},
                title:{type:String, required:true},
                price:{type:Number, required:true},
                image:{type:String, required:true}
            },
        ],
        totalProducts:{type:Number, default:0},
        totalPrice:{type:Number, default:0},
        shippingAddress:{type:String, required:true},
        razorpayOrderId:String,
        paymentId:{type:String, required:true},
        paymentStatus:{type:String, required:true},
        orderStatus:{type:String, enum:["pending", "ordered", "shipped", "delivered", "cancelled"], default:"pending"},
        createdAt:{type:Date, default:Date.now()},
        deliveredAt:{type:Date}
})

const Order=mongoose.model("Order", orderSchema)

export default Order;