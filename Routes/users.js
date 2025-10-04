import express from "express"
import User from "../Models/users.js"
import bcrypt from "bcrypt"
import joiUserSchema from "../Validations/user.js"
import jwt from "jsonwebtoken"
import authmiddleware from "../middlewares/auth.js"


const router=express.Router()
const secretkey=process.env.JWT_KEY 
const generatetoken=(data)=>{
    return(
        jwt.sign(data,secretkey,{expiresIn:"2h"})
    )
}


router.post("/", async(req,res)=>{
    const {error}=joiUserSchema.validate(req.body)
    if(error){
        return res.status(400).json(error.details[0].message)
    }
    const {name,email,password,address}=req.body
    const user=await User.findOne({email:email})
    if (user)
       return res.status(400).json({"message":"User already exist!"})
    const hashpass=await bcrypt.hash(password,10)
    const newUser=new User({
        name:name,
        email:email,
        password:hashpass,
        address:address
    })
    try {
        const data =await newUser.save()
        const token=generatetoken({_id:newUser._id,
                                    name:newUser.name,
                                    role:newUser.role})
        return res.status(201).json({data:data,authToken :token})
    } catch (error) {
        res.status(500).send("something went wrong at our side")
    }
    res.send(`${name},${email},${password},${address}`)
})

router.post("/login",async(req,res,next)=>{
    const {email,password}=req.body
    if (!email || !password)
        return res.status(400).json({"message":"incomplete data! "})
    try {
        const user=await User.findOne({email:email})
        if(!user){
            return res.status(401).json({message:"Invalid Credentials!"})
        }
        const validpass=await bcrypt.compare(password,user.password)
        if (validpass){
            const token=generatetoken({_id:user._id,name:user.name,role:user.role})
            res.status(200).json({authToken :token})
        }
        else
             return res.status(401).json({message:"Invalid Credentials!"})

    } catch (error) {
        next(error)
    }

})

router.get("/",authmiddleware, async(req,res)=>{
    const user=await User.findById(res.user._id).select("-password")
    res.json(user)
})

export default router