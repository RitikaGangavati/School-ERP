import api from "../utils/axios";

const BASE_URL = "/api/subject-teachers";

export const createSubjectTeacher = (data) => api.post(`${BASE_URL}/create`, data);
export const getSubjectTeachers = () => api.get(`${BASE_URL}/list`);
export const getSubjectTeacherById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateSubjectTeacher = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteSubjectTeacher = (id) => api.delete(`${BASE_URL}/delete/${id}`);