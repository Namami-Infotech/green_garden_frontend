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
  accessToken: string | null;
  refreshToken: string | null;
  token: string | null; // convenience alias pointing to accessToken
  isLoading: boolean;
  login: (accessToken: string, refreshTokenOrUser?: string | CurrentUser | null, userParam?: CurrentUser) => void;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to read and write cookies in browser
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// Strictly read auth tokens and user ONLY from cookies (no localStorage)
function readAuthFromCookies(): { accessToken: string | null; refreshToken: string | null; user: CurrentUser | null } {
  if (typeof document === "undefined") return { accessToken: null, refreshToken: null, user: null };
  try {
    const accessToken = getCookie("accessToken") || getCookie("access_token") || getCookie("socity_auth_token");
    const refreshToken = getCookie("refreshToken") || getCookie("refresh_token");
    const userStr = getCookie("user") || getCookie("socity_auth_user");

    if (accessToken && accessToken !== "undefined" && accessToken !== "null" && userStr) {
      return {
        accessToken,
        refreshToken: (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") ? refreshToken : null,
        user: JSON.parse(userStr),
      };
    } else {
      // Clear corrupt or invalid cookie
      deleteCookie("accessToken");
      deleteCookie("refreshToken");
      deleteCookie("user");
      deleteCookie("socity_auth_token");
      deleteCookie("socity_auth_user");
    }
  } catch {
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    deleteCookie("user");
  }
  return { accessToken: null, refreshToken: null, user: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Lazy initializers read synchronously from cookies before first paint — no localStorage
  const [authData] = useState(() => readAuthFromCookies());
  const [accessToken, setAccessToken] = useState<string | null>(authData.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(authData.refreshToken);
  const [user, setUser] = useState<CurrentUser | null>(authData.user);

  const isLoading = false;

  const login = useCallback(
    (newAccessToken: string, refreshTokenOrUser?: string | CurrentUser | null, userParam?: CurrentUser) => {
      if (!newAccessToken || newAccessToken === "undefined" || newAccessToken === "null") return;

      let newRefreshToken: string | null = null;
      let newUser: CurrentUser | null = null;

      if (typeof refreshTokenOrUser === "string") {
        newRefreshToken = refreshTokenOrUser;
        newUser = userParam || null;
      } else if (refreshTokenOrUser && typeof refreshTokenOrUser === "object") {
        newUser = refreshTokenOrUser as CurrentUser;
      }

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      // Save strictly to cookies (NO localStorage!)
      setCookie("accessToken", newAccessToken, 1);
      if (newRefreshToken && newRefreshToken !== "undefined" && newRefreshToken !== "null") {
        setCookie("refreshToken", newRefreshToken, 7);
      }
      if (newUser) {
        setUser(newUser);
        setCookie("user", JSON.stringify(newUser), 7);
      }

      // Purge any stale localStorage data
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
    },
    []
  );

  const logout = useCallback(async () => {
    // 1. Call backend logout API to clear HttpOnly cookies from server
    try {
      const { apiClient } = await import("../lib/api-client");
      await apiClient.post("/auth/logout");
    } catch {
      // ignore network errors
    }

    // 2. Clear local state
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // 3. Clear frontend cookies
    deleteCookie("accessToken");
    deleteCookie("refreshToken");
    deleteCookie("user");
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    deleteCookie("socity_auth_token");
    deleteCookie("socity_auth_user");
    deleteCookie("socity_refresh_token");

    // 4. Ensure no storage residual
    if (typeof localStorage !== "undefined") {
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
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        token: accessToken, // backwards-compatible alias
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
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
