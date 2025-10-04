const checkSeller=(req,res,next)=>{
    console.log(req.user.role);
    if(!req.user || req.user.role!=="seller"){
        
        return res.status(403).json({message:"Access Denied : Sellers Only ! "})
    }
    
    next()
}

export default checkSeller;