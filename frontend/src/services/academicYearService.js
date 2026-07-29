import api from "../utils/axios";

const BASE_URL = "/api/academic-Years";

export const createAcademicYear = (data) => api.post(`${BASE_URL}/create`, data);
export const getAcademicYears = () => api.get(`${BASE_URL}/list`);
export const getAcademicYearById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateAcademicYear = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteAcademicYear = (id) => api.delete(`${BASE_URL}/delete/${id}`);