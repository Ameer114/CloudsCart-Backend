import authmiddleware from "../middlewares/auth.js";
import Cart from "../Models/cart.js";
import express from "express"
import Products from "../Models/products.js";
const router=express.Router()

router.post("/:productid",authmiddleware, async(req,res)=>{
const {quantity}=req.body;
const productid=req.params.productid;
const userId=req.user._id

//validating inputs
if(!productid || !quantity){
return res.status(400).json({message:"Missing Required Fields!"})
}

//check product existance in db
const product= await Products.findById(productid)
if(!product){
    return res.status(404).json({message:"Product not found!"})
}

//check whether asking qunatity is within stock or not
if(quantity>product.stock)
    return res.status(400).json({message:"stock is not enough! "})


//find user's cart if it's existing
let cart = await Cart.findOne({user:userId})
if (!cart){
 cart=new Cart({
    user:userId,
    products:[],
        totalProducts:0,
        totalCartPrice:0,
})
}

//check if product is already in cart
const existingProductIndex=cart.products.findIndex((product)=>product.productId.toString()===productid.toString())
if(existingProductIndex !== -1){
    if(cart.products[existingProductIndex].quantity+quantity>=product.stock)
        return res.status(400).json({message:"Stock is not enough!"})

    cart.products[existingProductIndex].quantity+=quantity
}
else{
    cart.products.push({
        productId:productid,
        quantity:quantity,
        title:product.title,
        price:product.price,
        image:product.images[0]
    })
}


cart.totalProducts=cart.products.reduce((total,product)=>{
    return total+product.quantity
},0)

cart.totalCartPrice=cart.products.reduce((total,product)=>{
    return total+product.price*product.quantity
},0)

await cart.save()
res.status(200).json({message:"Product Added to cart Successfully! ", cart:cart})


}
)

router.get("/",authmiddleware, async(req,res)=>{
const id=req.user._id
const cart=await Cart.findOne({user:id})
if(!cart){
    return res.status(400).json({message:"nothing in your cart !"})
}
return res.status(200).json(cart)
})

router.patch("/increase/:productid",authmiddleware, async(req,res)=>{
    const productid=req.params.productid
    const cart=await Cart.findOne({user:req.user._id})
    const product=await Products.findById(productid)

    if(!cart){
        return res.status(404).json({message:"Cart not found!"})
    }
    const productIndex=cart.products.findIndex((product)=>product.productId.toString()===productid)
    
    if(productIndex===-1)
        return res.status(404).json({message:"product not found !" })

   

    if(cart.products[productIndex].quantity+1>product.stock)
        return res.status(400).json({message:"Product out of Stock!"})

        cart.products[productIndex].quantity +=1
        //update total products and total price

        cart.totalProducts+=1
        cart.totalCartPrice+=product.price

        await cart.save()
        
        res.status(200).json({message:"Product increased by one",cart:cart})
})

router.patch("/decrease/:productid",authmiddleware, async(req,res)=>{
    const productid=req.params.productid
    if(!productid)
        res.status(400).json({message:"please mention product id! "})

    const cart=await Cart.findOne({user:req.user._id})
    const product= await Products.findById(productid)

    if (!cart)
        return res.status(400).json({message:"user don't have cart!"})
    
    const productindex=cart.products.findIndex((product)=>product.productId.toString()===productid)
    if (productindex===-1)
        return res.status(400).json({message:"product not found!"})

    if (cart.products[productindex].quantity<=1){
        cart.products.splice(productindex,1)
    }
    else{
        cart.products[productindex].quantity-=1
    }
    cart.totalProducts-=1
    cart.totalCartPrice-=product.price
    await cart.save()
    res.status(200).json({message:"product decresed by one! ", cart:cart})
        
})

router.patch("/remove/:productid",authmiddleware, async(req,res)=>{
const cart=await Cart.findOne({user:req.user._id})
const productid=req.params.productid;
if(!productid)
    return res.status(400).json({message:"please mention product id!"})
if (!cart)
    return res.status(400).json({message:"cart not found!"})
const productindex=cart.products.findIndex((product)=>product.productId.toString()===productid)

if(productindex==-1){
    return res.status(404).json({message:"product not in cart!"})
}

const {price, quantity}=cart.products[productindex]

if (cart.products.length<1 && cart.products[productindex].productId.toString()===productid){
    await Cart.findByIdAndDelete(cart._id)
    return res.json({message:"Cart Removed Successfully!"})
}

cart.totalProducts-=quantity
cart.totalCartPrice-=price*quantity

cart.products.splice(productindex,1)


await cart.save()
res.status(200).json({message:"product removed successfully! ",cart:cart})



})

export default router