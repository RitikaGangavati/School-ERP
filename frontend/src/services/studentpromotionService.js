import api from "../utils/axios";

const BASE_URL = "/api/student-promotion";

export const getStudentsForPromotion = (params) => api.get(`${BASE_URL}/students`, { params });
export const promoteStudents = (data) => api.post(`${BASE_URL}/promote`, data);
export const getStudentPromotionHistory = (studentId) => api.get(`${BASE_URL}/history/${studentId}`);