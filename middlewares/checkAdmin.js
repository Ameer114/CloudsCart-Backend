const checkAdmin=(req,res,next)=>{
    if(!req.user || req.user.role!=="admin"){
        return res.status(403).json({message:"Not Allowed : Only Admins ! "})
    }
    next();

}

export default checkAdmin