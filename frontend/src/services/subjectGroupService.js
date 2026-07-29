import api from "../utils/axios";

const BASE_URL = "/api/subject-groups";

export const createSubjectGroup = (data) => api.post(`${BASE_URL}/create`, data);
export const getSubjectGroups = () => api.get(`${BASE_URL}/list`);
export const getSubjectGroupById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateSubjectGroup = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteSubjectGroup = (id) => api.delete(`${BASE_URL}/delete/${id}`);