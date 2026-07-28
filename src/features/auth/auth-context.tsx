"use client";

import {
  createContext,
  useCallback,
  useContext,
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
    rank: "Oficial",
    badge: "A-001",
  },
};

function readSavedUser() {
  if (DEV_BYPASS) return DEV_USER;
  if (typeof window === "undefined") return null;

  const token = getAccessToken();
  const savedUser = localStorage.getItem(USER_KEY);

  if (!token || !savedUser) return null;

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    clearTokens();
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => readSavedUser());
  const [isLoading] = useState(false);

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
        return;
      }

      const data = await loginRequest(username, password);
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
    },
    [setUser],
  );

  const logout = useCallback(() => {
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      return;
    }

    clearTokens();
    setUser(null);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [setUser]);

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
