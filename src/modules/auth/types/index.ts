export type UserRole = "USER" | "SECRETARY" | "ACCOUNTANT" | "SECURITY";

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}
