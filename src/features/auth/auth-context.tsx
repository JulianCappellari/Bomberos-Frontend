"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";
import { getMeRequest, loginRequest } from "@/services/auth.service";
import { api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { AuthUser } from "@/types/auth";
import { clearTaskOutbox, readTaskOutbox } from "@/lib/task-outbox";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "bomberos_user";

const DEV_BYPASS = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

const DEV_USER: AuthUser = {
  id: "dev-admin",
  username: "admin",
  email: "admin@bomberos.local",
  role: "ADMIN",
  isActive: true,
  isPendingApproval: false,
  profile: {
    fullName: "Administrador Demo",
    rank: "Oficial",
    badge: "A-001",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const current = DEV_BYPASS ? DEV_USER : getAccessToken() ? await getMeRequest() : null;
        if (active) setUserState(current);
      } catch {
        if (active) { clearTokens(); setUserState(null); }
      } finally { if (active) setIsLoading(false); }
    };
    void bootstrap();
    return () => { active = false; };
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);

    if (typeof window !== "undefined") {
      if (nextUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      if (DEV_BYPASS) {
        setUser(DEV_USER);
        return DEV_USER;
      }

      const data = await loginRequest(username, password);
      queryClient.clear();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
      return data.user;
    },
    [setUser, queryClient],
  );

  const logout = useCallback(async () => {
    if (user && readTaskOutbox(user.id).length && !window.confirm("Tiene acciones sin sincronizar. Cerrar sesion elimina esos pendientes de este dispositivo. Desea continuar?")) return;
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      return;
    }

    try { await api.post("/auth/logout"); } catch { /* Local logout remains available when offline. */ }
    if ("serviceWorker" in navigator) {
      try { const registration = await navigator.serviceWorker.getRegistration("/"); await (await registration?.pushManager.getSubscription())?.unsubscribe(); } catch { /* The revoked server session also prevents subsequent delivery. */ }
    }
    clearTokens();
    queryClient.clear();
    if (user) clearTaskOutbox(user.id);
    setUser(null);

    if (typeof window !== "undefined") {
      window.location.replace(new URL("/login", window.location.origin).href);
    }
  }, [setUser, queryClient, user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setUser,
    }),
    [user, isLoading, login, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
