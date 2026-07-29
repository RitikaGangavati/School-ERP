import api from "../utils/axios";

const BASE_URL = "/api/class-teachers";

export const createClassTeacher = (data) => api.post(`${BASE_URL}/create`, data);

export const getClassTeachers = () => api.get(`${BASE_URL}/list`);

export const getClassTeacherById = (id) => api.get(`${BASE_URL}/details/${id}`);

export const updateClassTeacher = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);

export const deleteClassTeacher = (id) => api.delete(`${BASE_URL}/delete/${id}`);