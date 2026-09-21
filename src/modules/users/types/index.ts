import { UserRole } from "../../auth/types/index";

export interface UserItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  status?: "ACTIVE" | "INACTIVE" | "PENDING";
}

export interface UserFilterOptions {
  search?: string;
  role?: UserRole;
  status?: string;
}
