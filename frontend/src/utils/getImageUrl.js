const BASE_URL = "http://localhost:5000";

export const getImageUrl = (path) => (path ? `${BASE_URL}${path}` : "");