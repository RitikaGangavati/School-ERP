import { createSession } from "./session";

// Same storage keys your authSlice and ProtectedRoute already use
const session = createSession({
  baseURL: "http://localhost:5000", // your server (no /api here, your services add it)
  authPrefix: "/api/auth",
  tokenStorage: {
    get: () => localStorage.getItem("token"),
    set: (token) => (token ? localStorage.setItem("token", token) : localStorage.removeItem("token")),
  },
});

// For login/logout only. These skip the refresh interceptor on purpose.
export const loginRequest = session.login;
export const logoutRequest = session.logout;

// Used by store.js to keep Redux in sync with silent refreshes
export const onSessionChange = session.onSessionChange;
export const getToken = session.getToken;

// Use this for every other API call (adds the token, refreshes on 401, retries)
export default session.api;