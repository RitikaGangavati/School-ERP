const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/:type/photo", protect, (req, res) => {
  const uploadSingle = upload.single("photo");

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum allowed size is 5MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // e.g. our custom fileFilter error ("Only JPEG, PNG, or WEBP images are allowed")
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const type = req.params.type;
    const fileUrl = `/uploads/${type}/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      url: fileUrl,
    });
  });
});

module.exports = router;