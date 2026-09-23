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

// Helper functions to read and write cookies in browser
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function readAuthFromStorage(): { token: string | null; user: CurrentUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const savedToken = getCookie("socity_auth_token");
    const savedUserStr = getCookie("socity_auth_user");

    if (savedToken && savedUserStr) {
      return { token: savedToken, user: JSON.parse(savedUserStr) };
    }
  } catch {
    deleteCookie("socity_auth_token");
    deleteCookie("socity_auth_user");
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
    // Save to cookies instead of localStorage
    setCookie("socity_auth_token", newToken, 1);
    setCookie("socity_auth_user", JSON.stringify(newUser), 7);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("socity_auth_token");
      localStorage.removeItem("socity_auth_user");
    }
  }, []);

  const logout = useCallback(async () => {
    // 1. Call backend logout API to clear HttpOnly cookies from server
    try {
      const { apiClient } = await import("../lib/api-client");
      await apiClient.post("/auth/logout");
    } catch {
      // ignore network errors
    }

    // 2. Clear state
    setToken(null);
    setUser(null);

    // 3. Clear frontend cookies
    deleteCookie("socity_auth_token");
    deleteCookie("socity_auth_user");
    deleteCookie("accessToken");
    deleteCookie("access_token");
    deleteCookie("refreshToken");
    deleteCookie("refresh_token");

    // 4. Clear storage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("socity_auth_token");
      localStorage.removeItem("socity_auth_user");
      localStorage.clear();
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    // 5. Navigate to login
    router.replace("/login");
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
