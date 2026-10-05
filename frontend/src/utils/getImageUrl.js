const BASE_URL = "http://localhost:5000";

export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path; // Cloudinary URL, use as-is
  return `${BASE_URL}${path}`;              // old local /uploads/... path
};