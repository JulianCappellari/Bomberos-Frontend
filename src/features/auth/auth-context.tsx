"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";
import { loginRequest } from "@/services/auth.service";
import { AuthUser } from "@/types/auth";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "bomberos_user";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

const DEV_USER: AuthUser = {
  id: "dev-admin",
  username: "admin",
  email: "admin@bomberos.local",
  role: "ADMIN",
  isActive: true,
  isPendingApproval: false,
  profile: {
    fullName: "Administrador Demo",
    rank: "Jefe de Guardia",
    badge: "A-001",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (DEV_BYPASS) {
      setUserState(DEV_USER);
      setIsLoading(false);
      return;
    }

    const token = getAccessToken();
    const savedUser =
      typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;

    if (token && savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch {
        clearTokens();
        localStorage.removeItem(USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  function setUser(user: AuthUser | null) {
    setUserState(user);

    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  async function login(username: string, password: string) {
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      return;
    }

    const data = await loginRequest(username, password);
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
  }

  function logout() {
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      return;
    }

    clearTokens();
    setUser(null);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setUser,
    }),
    [user, isLoading]
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