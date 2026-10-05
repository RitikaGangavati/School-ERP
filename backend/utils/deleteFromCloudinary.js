const cloudinary = require("./cloudinary");

const URL_RE = /res\.cloudinary\.com\/[^/]+\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/;

const deleteFromCloudinary = async (url) => {
  if (!url) return;
  const match = url.match(URL_RE);
  if (!match) return; // old local /uploads/... path or non-Cloudinary URL, skip

  const [, resourceType, path] = match;
  // images: public_id has no extension; raw files: extension is part of the public_id
  const publicId = resourceType === "image" ? path.replace(/\.[^/.]+$/, "") : path;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.error("Cloudinary delete error:", e.message);
  }
};

module.exports = deleteFromCloudinary;