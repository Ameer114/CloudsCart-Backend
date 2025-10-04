import express from "express"
import authmiddleware from "../middlewares/auth.js";
import checkSeller from "../middlewares/checkSeller.js";
import multer from "multer"
import Products from "../Models/products.js";
import Category from "../Models/category.js";
// import fs from "fs/promises"
// import path from "path";
import fileUpload from "express-fileupload";
import cloudinary from "../config/cloudinary.js";
import productImageValidation from '../middlewares/productImageValidation.js'
// import { fileURLToPath } from "url";

// const __filename=fileURLToPath(import.meta.url)
// const __dirname=path.dirname(__filename)

const router=express.Router()

router.use(fileUpload({
  useTempFiles: true,  // saves files temporarily in a temp folder
  tempFileDir: "/tmp/" // default temp folder
}));

// const storage=multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,"upload/products")
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
//         fileSize:4*1024*1024
//     }
// });
//upload.array("images",8)  <-add this middleware after checkSeller

router.get("/suggestions", async(req,res)=>{
    try {
        const search=req.query.search
        const products= await Products.find({
            title:{$regex:search, $options:"i"},
        }).select("_id title").limit(10);
        
        res.json(products)
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal Server Error! "})
    }
})

router.post("/",authmiddleware,checkSeller, productImageValidation, async(req,res)=>{
const {title, description, category, price, stock}=req.body
const images=[]
const recievedImages=req.validatedImages;
if (recievedImages.length===0){
    return res.status(400).json({message:"At least one image is Required ! "})
}

for(let file of recievedImages){
    // Example: upload to Cloudinary
    const result=await cloudinary.uploader.upload(file.tempFilePath,{
        folder:"cloudscart/products",
        public_id:`${Date.now()}-${file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "")}`,
        resource_type:'image',
    })
    images.push(result.secure_url);
}

const newProduct=new Products({
    title, 
    description, 
    seller:req.user._id,
    category,
    price, 
    stock,
    images // store Cloudinary URLs

})

await newProduct.save()
res.status(201).json(newProduct)
})

router.get("/", async(req,res)=>{
    const page=parseInt(req.query.page) || 1;
    const perpage=parseInt(req.query.perpage) || 8
    const querycategory=req.query.category || null
    const querySearch=req.query.search || null
    
    const query={}
    if (querycategory){
        const category=await Category.findOne({name:querycategory})
        console.log(category);
        
        if(!category){
           return res.status(404).json({message:"category not found!"})
        }
        query.category=category._id;
    }

    if(querySearch){
        query.title={$regex:querySearch, $options:"i"};
    }


    const products= await Products.find(query)
    .select("-description -seller -category -__v")
    .skip((page-1)*perpage)
    .limit(perpage)
    .lean();

    const updatedProducts=products.map((product)=>{
        const numberOfReviews=product.reviews.length;
        const sumOfRatings=product.reviews.reduce((sum,reviews)=>sum+reviews.rate,0)
    
    const averageRating=sumOfRatings/(numberOfReviews || 1)
    return{
        ...product,
        images:product.images[0],
        reviews:{numberOfReviews, averageRating}
    }
    })
    const totalproducts=await Products.countDocuments(query)
    const totalpages=Math.ceil(totalproducts/perpage)
    res.json({products:updatedProducts,
        totalproducts,
        totalpages,
        currentPage:page,
        postPerPage:perpage
    })
})

router.get("/:id", async(req,res)=>{
    const id=req.params.id || null
    if(!id){
        return res.status(400).json({message:"id not Found! "})
    }
    
    const product= await Products.findById(id)
    .populate("seller", "_id name email")
    .populate("reviews.user", "_id name email")
    .select("-category -__v")
  
    res.status(200).json(product)
})

router.delete("/:id", authmiddleware, async(req,res)=>{
const productid=req.params.id;
const product=await Products.findById(productid).select("seller images");

if(!product){
    return res.status(404).json({message:"product not found !"})
}

if(
    req.user.role==="admin" ||
    req.user._id.toString()===product.seller.toString() 
){
    
    if(product.images && product.images.length>0){
       for (let imgUrl of product.images) {
        try {
          const extractPublicId = (url) => {
            const parts = url.split('/');
            const fileWithExt = parts.pop();
            const folderPath = parts.slice(parts.indexOf('upload') + 1).join('/');
            return `${folderPath}/${fileWithExt.split('.')[0]}`;
          };

          const publicId = extractPublicId(imgUrl);
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error(`Error deleting image from Cloudinary: ${imgUrl}`, error);
        }
      }
    }
    await product.deleteOne()
    return res.status(200).json({message:"Product deleted successfully! "})
}
return res.status(403).json({
    message:"Access Denied : Only admin or seller can delete this product! "
})

})

const extractPublicId = (url) => {
  const parts = url.split('/');
  const fileWithExt = parts.pop(); // e.g., "1728037354000-video-game.png"
  const folderPath = parts.slice(parts.indexOf('upload') + 1).join('/'); // "cloudscart/products"
  const publicId = `${folderPath}/${fileWithExt.split('.')[0]}`;
  return publicId;
};




export default router;