import api from "../utils/axios";

const BASE_URL = "/api/roles";

export const createRole = (data) => api.post(`${BASE_URL}/create`, data);
export const getRoles = () => api.get(`${BASE_URL}/list`);
export const getRoleById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateRole = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteRole = (id) => api.delete(`${BASE_URL}/delete/${id}`);