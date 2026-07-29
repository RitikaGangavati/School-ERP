import api from "../utils/axios";

export const uploadPhoto = (file, type = "general") => {
  const formData = new FormData();
  formData.append("photo", file);

  return api.post(`/api/upload/${type}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};