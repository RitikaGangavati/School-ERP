import api from "../utils/axios";

export const loginUser = (data) => {
    return api.post("/api/auth/login", data);
};