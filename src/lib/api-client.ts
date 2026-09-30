const getBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKENDURL ||
    process.env.BACKENDURL ||
    "http://localhost:5007/api"
  );
};




export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookieValue(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== "undefined") {
      const token = getCookieValue("accessToken") || getCookieValue("access_token");
      if (token && token !== "undefined" && token !== "null" && token !== "mock_token") {
        return token;
      }
    }
    return null;
  }

  private async autoRefreshToken(): Promise<string | null> {
    try {
      const baseUrl = getBaseUrl();
      const refreshToken = getCookieValue("refreshToken") || getCookieValue("refresh_token");

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
        },
        body: refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({}),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const newAccessToken = data?.data?.accessToken;
      const newRefreshToken = data?.data?.refreshToken;

      if (newAccessToken && newAccessToken !== "undefined" && newAccessToken !== "null") {
        // Set purely in cookies
        setCookieValue("accessToken", newAccessToken, 1);
        if (newRefreshToken && newRefreshToken !== "undefined" && newRefreshToken !== "null") {
          setCookieValue("refreshToken", newRefreshToken, 7);
        }
        return newAccessToken;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token && token !== "mock_token" && token !== "undefined" && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });

    // Auto-refresh token if 401 unauthorized
    if (response.status === 401 && !isRetry && typeof window !== "undefined") {
      const newToken = await this.autoRefreshToken();
      if (newToken) {
        return this.request<T>(endpoint, options, true);
      }

      // If 401 persists and refresh failed, clear cookies and redirect to login
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        setCookieValue("accessToken", "", -1);
        setCookieValue("refreshToken", "", -1);
        setCookieValue("user", "", -1);
        setCookieValue("access_token", "", -1);
        setCookieValue("refresh_token", "", -1);
        window.location.href = "/login";
      }
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    if (!response.ok) {
      throw new Error(data.message || "An unexpected error occurred");
    }

    return data;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
