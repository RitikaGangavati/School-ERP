import api from "../utils/axios";

const BASE_URL = "/api/subjects";

export const createSubject = (data) => api.post(`${BASE_URL}/create`, data);
export const getSubjects = () => api.get(`${BASE_URL}/list`);
export const getSubjectById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateSubject = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteSubject = (id) => api.delete(`${BASE_URL}/delete/${id}`);
