import express from 'express'
import 'dotenv/config'
import cors from "cors"
import './config/passport.js'
import "./DBconfig/connection.js"
import userroutes from './Routes/users.js'
import authroutes from './Routes/auth.js'
import categoryroutes from './Routes/category.js'
import productroutes from './Routes/products.js' 
import cartroutes from "./Routes/cart.js"
import winston from 'winston'
import orderRoutes from './Routes/orders.js'

const logger=winston.createLogger({
    level:"info",
    format:winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports:[
        new winston.transports.Console({level:"debug"}),
        new winston.transports.File({
            filename:"logs/errors.log",
            level:"error"
        })
    ]
})

const app=express()
const Port=process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use("/images/category",express.static("upload/category"))
app.use("/images/products",express.static("upload/products"))

app.use("/api/auth",authroutes)
app.use("/api/user",userroutes)
app.use("/api/category",categoryroutes)
app.use("/api/products",productroutes)
app.use("/api/cart",cartroutes)
app.use("/api/order",orderRoutes)

app.get("/",(req,res)=>{
res.send("hello ");
})

app.use((error, req, res, next)=>{
console.log('Running error middleware');
console.log(error);

logger.error(error.message,{
    method:req.method,
    path:req.originalUrl,
    stack:error.stack
})

return res.status(500).json({message:"Internal Server Error Man!"})

})

app.listen(Port,()=>{
    console.log('Running on',Port);
})
