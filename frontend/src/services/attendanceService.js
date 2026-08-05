import api from "../utils/axios";

const BASE_URL = "/api/attendance";

export const getAttendanceForDate = (params) => api.get(`${BASE_URL}/date`, { params });
export const saveAttendance = (data) => api.post(`${BASE_URL}/save`, data);
export const getStudentAttendance = (studentId, params) =>
  api.get(`${BASE_URL}/student/${studentId}`, { params });