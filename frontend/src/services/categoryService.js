import api from "../utils/axios";

const BASE_URL = "/api/category";

export const createCategory = (data) => api.post(`${BASE_URL}/create`, data);
export const getCategories = () => api.get(`${BASE_URL}/list`);
export const getCategoryById= (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateCategory = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteCategory = (id) => api.delete(`${BASE_URL}/delete/${id}`);

  