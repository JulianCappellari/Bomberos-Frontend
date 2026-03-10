import { api } from "./axios";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";

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
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();

        const response = await api.post("/auth/refresh", { refreshToken });

        const newAccessToken = response.data.accessToken;
        const currentRefreshToken = getRefreshToken();

        if (newAccessToken && currentRefreshToken) {
          setTokens(newAccessToken, currentRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch {
        clearTokens();

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export { api };