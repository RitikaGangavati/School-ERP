import api from "../utils/axios";

const BASE_URL = "/api/classes";

export const createClass = (data) => api.post(`${BASE_URL}/create`, data);
export const getClasses = () => api.get(`${BASE_URL}/list`);
export const getClassById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateClass = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteClass = (id) => api.delete(`${BASE_URL}/delete/${id}`);