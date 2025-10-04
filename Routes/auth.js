import express from "express"
import passport from "passport";
import User from "../Models/users.js";
import jwt from "jsonwebtoken"
const router=express.Router()

router.get('/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

router.get( '/google/callback',
    passport.authenticate( 'google', {
        session:false,
        failureRedirect:"http://localhost:5173/login"
}),

async(req,res)=>{
    const profile=req.user;

    const token=await handleOAuthCallback(profile,"googleId")
    res.redirect(`http://localhost:5173/?authToken=${token}`)
}
);

const handleOAuthCallback=async(profile,provider)=>{
    
    let user= await User.findOne({$or:[{provider:profile.id},
                                        {email:profile.emails[0].value}]})
    
    if(user){
        if(!user.provider){
            user.provider=profile.id
            await user.save()
        }
    }
    else{
        user= new User({
            name:profile.displayName,
            email:profile.emails[0].value,
            provider:profile.id
        })
        await user.save()
    }
    const token=jwt.sign({_id:user._id, name:user.name, role:user.role},process.env.JWT_KEY);
    return token;
}

export default router