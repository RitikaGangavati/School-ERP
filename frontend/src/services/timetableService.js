import api from "../utils/axios";

const BASE_URL = "/api/timetable";

export const createTimetable = (data) => api.post(`${BASE_URL}/create`, data);
export const generateTimetable = (data) => api.post(`${BASE_URL}/generate`, data);
export const getTimetable = (params) => api.get(`${BASE_URL}/filter`, { params });
export const getTimetableById = (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateTimetable = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteTimetable = (id) => api.delete(`${BASE_URL}/delete/${id}`);