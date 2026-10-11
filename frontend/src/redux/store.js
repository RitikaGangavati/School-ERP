import { configureStore } from "@reduxjs/toolkit";
import authReducer, { tokenRefreshed, logout } from "./auth/authSlice";
import { onSessionChange, getToken } from "../utils/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Keeps Redux in sync when the session module refreshes or ends the session by itself
onSessionChange((user) => {
  if (user) {
    store.dispatch(tokenRefreshed({ token: getToken(), user }));
  } else {
    store.dispatch(logout());
    // refresh was rejected: the session is over, go back to the login page
    if (window.location.pathname !== "/") window.location.assign("/");
  }
});