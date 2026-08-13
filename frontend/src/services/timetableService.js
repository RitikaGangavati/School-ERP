import api from "../utils/axios";

const BASE_URL = "/api/timetables";

export const createTimetable = (data) => api.post(`${BASE_URL}/create`, data);
export const getTimetables = () => api.get(`${BASE_URL}/list`);
export const getTimetableById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const getTimetableBySection = (params) => api.get(`${BASE_URL}/by-section`, { params,});      // GET BY CLASS + SECTION
export const getTimetableByTeacher = (params) => api.get(`${BASE_URL}/by-teacher`, { params, });    // GET BY TEACHER
export const updateTimetable = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteTimetable = (id) => api.delete(`${BASE_URL}/delete/${id}`);
