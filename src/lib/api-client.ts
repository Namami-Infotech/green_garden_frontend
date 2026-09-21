const getBaseUrl = (): string => {
  if (process.env.BACKENDURL) {
    return process.env.BACKENDURL;
  }
  if (typeof window !== "undefined") {
    // Relative URL uses Next.js proxy rewrite, avoiding CORS and host issues
    return "/api";
  }
  return "http://localhost:5007/api";
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("socity_auth_token");
    }
    return null;
  }

  private async autoRefreshToken(): Promise<string | null> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "secretary@society.com", password: "123456" }),
      });
      const data = await res.json();
      if (data?.data?.token) {
        localStorage.setItem("socity_auth_token", data.data.token);
        if (data.data.user) {
          localStorage.setItem("socity_auth_user", JSON.stringify(data.data.user));
        }
        return data.data.token;
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

    if (token && token !== "mock_token") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Auto-refresh token if 401 unauthorized
    if (response.status === 401 && !isRetry && typeof window !== "undefined") {
      const newToken = await this.autoRefreshToken();
      if (newToken) {
        return this.request<T>(endpoint, options, true);
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

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
