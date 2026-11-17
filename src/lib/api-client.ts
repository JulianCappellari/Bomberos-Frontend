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
import { toast } from "./toast";

const refreshApi = axios.create({ baseURL: api.defaults.baseURL, timeout: 15000 });
const refresh = createRefreshCoordinator({
  readAccess: getAccessToken, readRefresh: getRefreshToken,
  write: (tokens) => setTokens(tokens.accessToken, tokens.refreshToken),
  request: async (token) => (await refreshApi.post("/auth/refresh", { refreshToken: token })).data,
  isSessionRejected: (error) => axios.isAxiosError(error) && error.response?.status === 401,
  expire: () => {
    clearTokens();
    if (typeof window !== "undefined") window.location.replace(new URL("/login", window.location.origin).href);
  },
  lock: async (work) => typeof navigator !== "undefined" && navigator.locks
    ? await navigator.locks.request("bomberos-session-refresh", work) : await work(),
});

// Demo: el aviso de "accion simulada" se muestra solo para lo que hizo la persona (toque, tecla o envio
// de formulario en los ultimos segundos), no para los envios automaticos de fondo (marcas de lectura, sondeos).
let lastGesture = 0;
if (typeof window !== "undefined") {
  for (const type of ["pointerdown", "keydown", "submit"]) window.addEventListener(type, () => { lastGesture = Date.now(); }, { capture: true, passive: true });
}
type DemoAwareConfig = { _userAction?: boolean };

api.interceptors.request.use((config) => {
  (config as DemoAwareConfig)._userAction = Date.now() - lastGesture < 5000;
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const stepUp = cachedStepUp();
  if (stepUp && !config.headers["X-Step-Up"]) config.headers["X-Step-Up"] = stepUp;

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Cuenta demo: el servidor no ejecuta las acciones que guardan datos; responde "simulado" y aca se avisa.
    if (response.data && typeof response.data === "object" && (response.data as { demoSimulated?: unknown }).demoSimulated === true
      && (response.config as DemoAwareConfig)._userAction) {
      // Mas tiempo que un aviso comun: la pantalla puede mostrar encima su propio mensaje de exito.
      toast.success("La acción funcionó correctamente", "Es una cuenta de demostración: no se guardó ningún cambio.", 8000);
    }
    return response;
  },
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
