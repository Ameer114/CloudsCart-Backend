import 'dotenv/config'
import express from "express"
// import multer from "multer"
import Category from "../Models/category.js"
import checkAdmin from "../middlewares/checkAdmin.js"
import authmiddleware from "../middlewares/auth.js";
import categoryImageValidator from '../middlewares/categoryImageValidator.js'
import fileUpload from "express-fileupload";
import cloudinary from '../config/cloudinary.js';


const router=express.Router();

router.use(fileUpload({
  useTempFiles: true,  // saves files temporarily in a temp folder
  tempFileDir: "/tmp/" // default temp folder
}));


// const storage=multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,"upload/category")
//     },
//     filename:(req,file,cb)=>{
//         const timeStamp=Date.now()
//         const originalName=file.originalname.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9.-]/g,"")
//         cb(null,`${timeStamp}-${originalName}`)
//     }
// })

// const fileFilter=(req,file,cb)=>{
//     const allowedTypes=['image/jpeg','image/png','image/gif']
//     if (allowedTypes.includes(file.mimetype)){
//         cb(null,true)
//     }
//     else{
//         cb(new Error('Invalid File Type'),false)
//     }
// }

// const upload=multer({
//     storage:storage,
//     fileFilter:fileFilter,
//     limits:{
//         fileSize:2*1024*1024
//     }
// });
//upload.single("icon"), ///add this as middleware below after checkAdmin, <here>, async(...



router.post("/",authmiddleware, checkAdmin, categoryImageValidator, async(req,res)=>{

//     if(!req.body.name || !req.file){
//     return res.status(400).json({message:"Name and icon are Required!"})
// }

try {
    const file=req.files.icon;

    const result=await cloudinary.uploader.upload(file.tempFilePath,{
        folder:'cloudscart/category',
        public_id:`${Date.now()}-${file.name.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9.-]/g,"")}`,
        resource_type: "image",
    });

    
    const newCategory=new Category({
        name:req.body.name,
        image: result.secure_url,
    })
    
    await newCategory.save()
    res.status(201).json({message:'Category Added Successfully! ',
    Category:newCategory,
})
} catch (error) {
    console.error(error);
      res.status(500).json({ message: "Something went wrong!" });
}

})

router.get("/",async(req,res)=>{
const categories=await Category.find().sort("name")
res.status(200).json(categories)
})

export default router;