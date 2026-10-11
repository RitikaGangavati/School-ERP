import { loginRequest, logoutRequest } from "../utils/axios";

// Returns { data } like before, so the login page keeps working unchanged
export const loginUser = async (data) => {
  const body = await loginRequest(data.email, data.password);
  return { data: body };
};

// Tells the server to revoke the refresh token and clear the cookie
export const logoutUser = () => logoutRequest();