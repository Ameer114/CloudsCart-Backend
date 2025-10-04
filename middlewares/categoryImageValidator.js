const categoryImageValidator=(req,res,next)=>{
  console.log(req.files);
      if (!req.files || !req.files.icon) {
    return res.status(400).json({ message: "Icon file is required!" });
  }
  const file = req.files.icon;
  
  // File type check
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, GIF allowed." });
  }

  // File size check
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return res.status(400).json({ message: "File too large. Max 2MB allowed." });
  }

  next(); // everything is fine
}

export default categoryImageValidator