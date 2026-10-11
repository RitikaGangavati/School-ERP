import axios from "axios";

/*
 * Session handling for access + refresh tokens.
 *
 *  - The ACCESS token (15 min) lives in memory only. Nothing sensitive is in localStorage.
 *  - The REFRESH token is an httpOnly cookie. JavaScript can never read it; the browser
 *    sends it automatically to /api/auth/* (that is why every call uses withCredentials).
 *  - When a request gets 401, we call /auth/refresh once, then retry the request.
 *
 * IMPORTANT: your backend rotates the refresh token on every use and treats a reused
 * token as theft (it logs the user out everywhere). So two refresh calls must never run
 * with the same cookie at the same time. Two protections below:
 *   1. one in-flight refresh per tab (refreshPromise)
 *   2. a Web Lock, so several open tabs take turns instead of racing
 */
export function createSession({ baseURL, adapter, tokenStorage, authPrefix = "/auth" } = {}) {
  // Where the access token is kept. Default: memory only (safest).
  // Pass { get, set } to keep it somewhere else, e.g. localStorage.
  let memoryToken = null;
  const store = tokenStorage || { get: () => memoryToken, set: (t) => { memoryToken = t; } };
  const getToken = () => store.get();
  const setToken = (t) => store.set(t);
  let refreshPromise = null;
  let listener = () => {};

  const extra = adapter ? { adapter } : {};
  const api = axios.create({ baseURL, withCredentials: true, ...extra });
  // plain client for /auth calls: no interceptors, so a failing refresh can never loop
  const raw = axios.create({
    baseURL,
    withCredentials: true,
    headers: { "X-Requested-With": "XMLHttpRequest" },
    ...extra,
  });

  const callRefresh = async () => {
    const { data } = await raw.post(`${authPrefix}/refresh`);
    setToken(data.token);
    listener(data.user);
    return data;
  };

  const refreshSession = () => {
    if (!refreshPromise) {
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
      const run = locks ? locks.request("erp-refresh", callRefresh) : callRefresh();
      refreshPromise = run
        .catch((err) => {
          // Only end the session when the server said so; a network error keeps it
          if (err.response) {
            setToken(null);
            listener(null);
          }
          throw err;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise;
  };

  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { config, response } = error;
      if (response?.status === 401 && config && !config._retry) {
        config._retry = true;

        // Another request already refreshed while this one was in flight: just retry
        const used = config.headers?.Authorization;
        const current = getToken();
        if (current && used && used !== `Bearer ${current}`) {
          return api(config);
        }

        try {
          await refreshSession();
          return api(config);
        } catch {
          // refresh failed: the session is over, fall through with the original error
        }
      }
      return Promise.reject(error);
    }
  );

  const login = async (email, password) => {
    const { data } = await raw.post(`${authPrefix}/login`, { email, password });
    setToken(data.token);
    return data;
  };

  const logout = async () => {
    try {
      await raw.post(`${authPrefix}/logout`);
    } catch {
      // logging out must always succeed locally
    }
    setToken(null);
  };

  return {
    api,
    login,
    logout,
    refreshSession,
    getToken,
    onSessionChange: (fn) => {
      listener = fn;
    },
  };
}