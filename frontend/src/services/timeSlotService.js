import api from "../utils/axios";

const BASE_URL = "/api/time-slots";

export const createTimeSlot = (data) => api.post(`${BASE_URL}/create`, data);

export const getTimeSlots = () => api.get(`${BASE_URL}/list`);

export const getTimeSlotById = (id) => api.get(`${BASE_URL}/details/${id}`);

export const updateTimeSlot = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);

export const deleteTimeSlot = (id) => api.delete(`${BASE_URL}/delete/${id}`);