import axios from "axios";
import { createRefreshCoordinator } from "./refresh-coordinator";
import { api } from "./axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

const refreshApi = axios.create({ baseURL: api.defaults.baseURL, timeout: 15000 });
const refresh = createRefreshCoordinator({
  readAccess: getAccessToken, readRefresh: getRefreshToken,
  write: (tokens) => setTokens(tokens.accessToken, tokens.refreshToken),
  request: async (token) => (await refreshApi.post("/auth/refresh", { refreshToken: token })).data,
  expire: () => {
    clearTokens();
    if (typeof window !== "undefined") window.location.replace(new URL("/login", window.location.origin).href);
  },
  lock: async (work) => typeof navigator !== "undefined" && navigator.locks
    ? await navigator.locks.request("bomberos-session-refresh", work) : await work(),
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !["/auth/login", "/auth/refresh", "/auth/logout"].includes(originalRequest.url) &&
      !originalRequest?._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const authorization = String(originalRequest.headers.Authorization || "");
        const newAccessToken = await refresh(authorization.replace(/^Bearer /, "") || null);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (failure) {
        return Promise.reject(failure);
      }
    }

    if (error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED" && typeof window !== "undefined" && window.location.pathname !== "/security") {
      window.location.replace(new URL("/security", window.location.origin).href);
    }

    return Promise.reject(error);
  }
);

export { api };
