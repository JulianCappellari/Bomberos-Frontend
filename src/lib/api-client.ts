import axios from "axios";
import { createRefreshCoordinator } from "./refresh-coordinator";
import { api } from "./axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";
import { cachedStepUp, clearStepUp, requestStepUp } from "./step-up";

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
  const stepUp = cachedStepUp();
  if (stepUp && !config.headers["X-Step-Up"]) config.headers["X-Step-Up"] = stepUp;

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

    // Accion critica sin confirmacion reciente: se pide la contrasena y se reintenta una vez.
    if (error.response?.status === 428 && error.response?.data?.code === "STEP_UP_REQUIRED" && originalRequest && !originalRequest._stepUp) {
      originalRequest._stepUp = true;
      clearStepUp();
      const token = await requestStepUp();
      if (token) { originalRequest.headers["X-Step-Up"] = token; return api(originalRequest); }
      error.message = "Acción cancelada: no se confirmó la contraseña.";
      if (error.response.data) error.response.data.message = "Acción cancelada: no se confirmó la contraseña.";
    }

    if (error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED" && typeof window !== "undefined" && window.location.pathname !== "/security") {
      window.location.replace(new URL("/security", window.location.origin).href);
    }

    return Promise.reject(error);
  }
);

export { api };
