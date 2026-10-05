const multer = require("multer");

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const DOC_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const makeUploader = (allowed, maxMB, errMsg) =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) =>
      allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error(errMsg), false),
    limits: { fileSize: maxMB * 1024 * 1024 },
  });

const uploadImage = makeUploader(IMAGE_MIME, 5, "Only JPEG, PNG or WEBP images are allowed");
const uploadDoc = makeUploader(DOC_MIME, 10, "Only PDF, DOC or DOCX files are allowed");

module.exports = { uploadImage, uploadDoc };