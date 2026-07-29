import api from "../utils/axios";

const BASE_URL = "/api/sections";

export const createSection = (data) => api.post(`${BASE_URL}/create`, data);
export const getSections = () => api.get(`${BASE_URL}/list`);
export const getSectionById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateSection = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteSection = (id) => api.delete(`${BASE_URL}/delete/${id}`);