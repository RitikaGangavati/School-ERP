import api from "../utils/axios";

const BASE_URL = "/api/house";

export const createHouse = (data) => api.post(`${BASE_URL}/create`, data);
export const getHouses = () => api.get(`${BASE_URL}/list`);
export const  getHouseById= (id) => api.get(`${BASE_URL}/details/${id}`);
export const updateHouse = (id, data) => api.put(`${BASE_URL}/update/${id}`, data);
export const deleteHouse = (id) => api.delete(`${BASE_URL}/delete/${id}`);
