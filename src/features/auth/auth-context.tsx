"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth";
import { loginRequest } from "@/services/auth.service";
import { AuthUser } from "@/types/auth";

type JwtPayload = {
  userId: string;
  role: "ADMIN" | "FIREFIGHTER" | "OPERATOR";
  exp: number;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        clearTokens();
        setUser(null);
      }
    } catch {
      clearTokens();
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const data = await loginRequest(username, password);
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    setUser(data.user);
  }

  function logout() {
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
    [user, isLoading],
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