import jwt from "jsonwebtoken"
const authmiddleware=(req,res,next)=>{
const authHeader=req.headers.authorization
if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({message:"Authorization Token Required ! "})
}
console.log(authHeader);
const token=authHeader.split(" ")[1]
try {
    const decodeuser=jwt.verify(token,process.env.JWT_KEY)
    req.user=decodeuser
    console.log(req.user);

    next()
} catch (error) {
    return res.status(401).json({message:"Invalid Token!"})
}
}

export default authmiddleware;