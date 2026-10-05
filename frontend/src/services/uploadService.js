import api from "../utils/axios";

export const uploadPhoto = (file, type = "general") => {
  const formData = new FormData();
  formData.append("photo", file);

  return api.post(`/api/upload/${type}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadFile = (file, type = "general") => {
  const formData = new FormData();
  formData.append("file", file); // must be "file" to match the /file route

  return api.post(`/api/upload/${type}/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};