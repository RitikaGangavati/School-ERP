import api from "../utils/axios";

const BASE_URL = "/api/teachers";

export const createTeacher = (data) => api.post(`${BASE_URL}/create`, data);
export const getTeachers = () => api.get(`${BASE_URL}/list`);
export const getTeacherById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateTeacher = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteTeacher = (id) => api.delete(`${BASE_URL}/delete/${id}`);