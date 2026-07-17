import api from "../utils/axios";

const BASE_URL = "/api/users";

// Reuses your existing register endpoint for creating users
export const createUser = (data) => api.post(`${BASE_URL}/create`, data);

export const getUsers = () => api.get(`${BASE_URL}/list`);

export const getUserById = (id) => api.get(`${BASE_URL}/details/${id}`);

export const updateUser = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);

export const deleteUser = (id) => api.delete(`${BASE_URL}/delete/${id}`);