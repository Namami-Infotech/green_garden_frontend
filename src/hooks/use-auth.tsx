"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../modules/auth/types/index";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: string;
}

interface AuthContextType {
  user: CurrentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: CurrentUser) => void;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronously reads auth from localStorage — called once on first render via lazy useState
function readAuthFromStorage(): { token: string | null; user: CurrentUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const savedToken = localStorage.getItem("socity_auth_token");
    const savedUser = localStorage.getItem("socity_auth_user");
    const isMockToken =
      !savedToken ||
      savedToken === "mock_token" ||
      savedToken === "mock-jwt-token";

    if (!isMockToken && savedUser) {
      return { token: savedToken, user: JSON.parse(savedUser) };
    }
  } catch {
    localStorage.removeItem("socity_auth_token");
    localStorage.removeItem("socity_auth_user");
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Lazy initializers run synchronously before first paint — no useEffect, no flash
  const [token, setToken] = useState<string | null>(() => readAuthFromStorage().token);
  const [user, setUser] = useState<CurrentUser | null>(() => readAuthFromStorage().user);

  // Auth state is always known synchronously — no loading state needed
  const isLoading = false;

  const login = useCallback((newToken: string, newUser: CurrentUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("socity_auth_token", newToken);
    localStorage.setItem("socity_auth_user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("socity_auth_token");
    localStorage.removeItem("socity_auth_user");
    router.push("/login");
  }, [router]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
