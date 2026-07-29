import api from "../utils/axios";

const BASE_URL = "/api/students";

export const createStudent = (data) => api.post(`${BASE_URL}/create`, data);
export const getStudents = () => api.get(`${BASE_URL}/list`);
export const getStudentById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateStudent = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteStudent = (id) => api.delete(`${BASE_URL}/delete/${id}`);