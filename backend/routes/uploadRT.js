const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { uploadImage, uploadDoc } = require("../middleware/uploadMiddleware");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const ALLOWED_UPLOAD_TYPES = ["students", "teachers", "general"];

const handleUpload = (uploader, fieldName, kind, maxMB) => (req, res) => {
  const { type } = req.params;
  if (!ALLOWED_UPLOAD_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid upload type" });
  }

  uploader.single(fieldName)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `File is too large. Maximum allowed size is ${maxMB}MB.`
          : err.message;
      return res.status(400).json({ success: false, message });
    }
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    try {
      const result = await uploadToCloudinary(req.file, type, kind);
      return res.status(200).json({
        success: true,
        message: kind === "image" ? "Photo uploaded successfully" : "File uploaded successfully",
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type, // "image" or "raw", needed for deleting later
      });
    } catch (e) {
      console.error("Cloudinary upload error:", e.message);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }
  });
};

router.post("/:type/photo", protect, handleUpload(uploadImage, "photo", "image", 5));
router.post("/:type/file", protect, handleUpload(uploadDoc, "file", "raw", 10));

module.exports = router;