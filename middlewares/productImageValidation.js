const productImageValidation=(req,res,next)=>{
if (!req.files || !req.files.images) {
    return res.status(400).json({ message: "At least one image is required!" });
  }

   let files = req.files.images;

  // If only one file was uploaded, wrap it in an array
  if (!Array.isArray(files)) {
    files = [files];
  }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 4 * 1024 * 1024; // 4MB

      for (let file of files) {
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ message: `Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF allowed.` });
    }

    // Check file size
    if (file.size > maxSize) {
      return res
        .status(400)
        .json({ message: `File too large: ${file.name}. Max 4MB allowed.` });
    }
  }

  req.validatedImages = files; // save validated files for later use
  next();
}

export default productImageValidation