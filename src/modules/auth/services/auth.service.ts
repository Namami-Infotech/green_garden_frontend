import { apiClient } from "../../../lib/api-client";
import { AuthResponse, LoginCredentials, RegisterCredentials, UserDTO } from "../types/index";

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (!response.data) throw new Error("Invalid response from server");
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", credentials);
    if (!response.data) throw new Error("Invalid response from server");
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  }

  async getProfile(): Promise<UserDTO> {
    const response = await apiClient.get<UserDTO>("/auth/me");
    if (!response.data) throw new Error("Failed to fetch profile");
    return response.data;
  }
}

export const authService = new AuthService();
