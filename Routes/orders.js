// import express from "express"
import authMiddleware from "../middlewares/auth.js"
// import Razorpay from "razorpay"
import Cart from "../Models/cart.js"
import Order from "../Models/orders.js"
// import crypto from "crypto" //built in library to hash 
// const router=express.Router()

// const fetchExchangeRate=async(targetCurrency)=>{
//     const response=await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/USD/${targetCurrency}`)
//     const data= await response.json()
//     return data.conversion_rate
// }

// router.post("/checkout", authMiddleware, async(req,res)=>{
// const {currency= "USD", shippingAddress}=req.body
// if(!shippingAddress)
//         return res.status(400).json({message:"please provide your delivery address"})

// const cart = await Cart.findOne({user:req.user._id})    
// if(!cart || cart.products.length===0){
//     return res.status(404).json({message: "Cart Not Found!"})
// }

// const razorpayInstance= new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret:process.env.RAZORPAY_KEY_SECRET
// })
// let amount=0
// if(currency==="USD"){
//     amount=cart.totalCartPrice
// }
// else{
//     const exchange_rate= await fetchExchangeRate(currency)
//         amount=(cart.totalCartPrice*exchange_rate).toFixed(2)
// }

// const order=await razorpayInstance.orders.create({
//     amount:amount *100,
//     currency:currency,//usd for us dollar
//     receipt:`receipt_${Date.now()}`
// })

// res.json({
//     success:true,
//     orderId:order.id,
//     amount:order.amount,
//     currency:order.amount
// })

// })

// router.post("/paymentVerify", authMiddleware, async(req,res)=>{
//     const {razorpay_order_id, razorpay_payment_id, razorpay_signature, shippingAddress}=req.body

//     if(!shippingAddress)
//         return res.status(400).json({message:"please provide your delivery address"})
//     const generatedSignature=crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")
    
//     //Hmac- nodejs method to create hash-based message authentication code, accepts 2 parameters
//     //sha256 - algorithm to hash , got this code from razor pay official site
//     //.update()- takes data we wanna hash
    
//     if(generatedSignature !== razorpay_signature){
//         return res.json({
//             success:false,
//             message:"Invalid Payment Signature!"
//         })
//     }

//     const cart= await Cart.findOne({user:req.params._id})
//     const newOrder= new Order({
//         user:req.params._id,
//         products:cart.products,
//         totalProducts:cart.totalProducts,
//         totalPrice:cart.totalCartPrice,
//         shippingAddress:shippingAddress,
//         paymentStatus:"paid",
//         paymentId:razorpay_payment_id,
//         razorpayOrderId:razorpay_order_id
//     })

//     await newOrder.save()
//     await cart.deleteOne()

//     return res.json({
//         success:true,
//         message:"Payment Verified Successfully!"
//     })
// })

// export default router



//paypal integration below!!

import express from "express"
const router=express.Router()
import paypalConfig from "../config/paypal.js"
import axios from "axios"
import checkAdmin from "../middlewares/checkAdmin.js"
import User from "../Models/users.js"
const {paypal, getAccessToken} =paypalConfig

router.post("/paypal/create-order",authMiddleware, async(req,res)=>{
    console.log('inside create order');
    
    const cart= await Cart.findOne({user:req.user._id})
    const shippingAddress= req.body.shippingAddress
    if(!shippingAddress){
        return res.status(400).json({message:"Please Provide shippingAddress!"})
    }
    if(!cart || cart.products.length === 0)
    return res.status(400).json({message:"Cart not found"})

const token=await getAccessToken()
const user=await User.findByIdAndUpdate(req.user._id,
    {address:shippingAddress},
    {new:true}
    )
await user.save()
console.log(user);
//updating user address with latest address provided during checkout

const response=await axios.post(`${paypal.baseUrl}/v2/checkout/orders`,
    {
    intent:"CAPTURE",//tells the paypal to capture the payment immediatly when the user aproves it
    purchase_units:[
        {
            description:"Shopping Cart Order",
            amount:{
                currency_code:"USD",
                value:cart.totalCartPrice
            }
        }
    ],
    application_context:{
        return_url:"http://localhost:5173/order",//frontend url
        cancel_url:"http://localhost:5173/cart"//frontend url of cancel
    }
},
{
    headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
    }
})
//accepts 3 parameters
//this api create new order that return data like order id and sub links

//now we need to return a link that if we send it to frontend, it'll open payment page
//here we go 
res.json({
    approvalUrl:response.data.links.find((link)=>link.rel==="approve").href
})

})

router.post("/paypal/capture-order", authMiddleware, async(req,res)=>{
    //this api is called to capture the payment after the user approves it
    const orderId=req.body.orderId
    const user = await User.findById(req.user._id);
    const shippingAddress = user?.address;

    console.log('inside capture order',shippingAddress);
    
    if(!orderId){
        return res.status(400).json({message:"Please Provide order Id!"})
    }

     if(!shippingAddress){
        return res.status(400).json({message:"Please Provide shippingAddress!"})
    }
    

    const token= await getAccessToken()
    const response=await axios.post(`${paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`, {}, {
        headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
    }
    })

    if(response.data.status === "COMPLETED"){
        const cart= await Cart.findOne({user:req.user._id})

        const newOrder= new Order({
            user:req.user._id,
            products:cart.products,
            totalProducts:cart.totalProducts,
            totalPrice:cart.totalCartPrice,
            shippingAddress:shippingAddress,
            paymentStatus:"paid",
            paymentId:response.data.purchase_units[0].payments.captures[0].id
        })

        await newOrder.save()
        await cart.deleteOne()
    res.json({
        status:await response.data.status
    })
    }
    else{
        return res.status(400).json({message:"payment not captured!"})
    }


})

router.get("/", authMiddleware, async(req,res)=>{
    const orders=await Order.find({user:req.user._id})
    .sort({createdAt: -1})
    .select("-user -shippingAddress -paymentId");

    res.json(orders)
})

router.patch("/order-status/:orderId", authMiddleware, checkAdmin, async(req,res)=>{
    const status=req.body.status
    const updatedOrder=await Order.findByIdAndUpdate(req.params.orderId,
        {orderStatus:status},
        {new:true}//telling to return updated data
    );
    if(!updatedOrder)
        return res.status(404).json({message:"Order not found!"})
    res.json({message:"order status updated !", updatedOrder})
})



export default router