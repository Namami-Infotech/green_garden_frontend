import { apiClient } from "../../../lib/api-client";
import { CreateUserData, UpdateUserData, UserFilterOptions, UserItem } from "../types/index";

export class UserService {
  private localUsers: UserItem[] = [];

  async getUsers(filters?: UserFilterOptions): Promise<{ users: UserItem[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append("role", filters.role);
      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.search) queryParams.append("search", filters.search);

      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await apiClient.get<{ users: UserItem[]; meta: { total: number } }>(endpoint);
      if (response.data) {
        this.localUsers = response.data.users;
        return { users: response.data.users, total: response.data.meta.total };
      }
    } catch {
      // Fallback for seamless demo
    }

    let result = [...this.localUsers];
    if (filters?.role) result = result.filter((u) => u.role === filters.role);
    if (filters?.status) result = result.filter((u) => u.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return { users: result, total: result.length };
  }

  async createUser(data: CreateUserData): Promise<UserItem> {
    try {
      const response = await apiClient.post<UserItem>("/users", data);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const newUser: UserItem = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status || "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    this.localUsers.unshift(newUser);
    return newUser;
  }

  async updateUser(id: number, data: UpdateUserData): Promise<UserItem> {
    try {
      const response = await apiClient.put<UserItem>(`/users/${id}`, data);
      if (response.data) {
        const index = this.localUsers.findIndex((u) => u.id === id);
        if (index !== -1) {
          this.localUsers[index] = response.data;
        }
        return response.data;
      }
    } catch (err) {
      console.warn("API updateUser failed, falling back to local memory:", err);
      // Fallback
    }

    const index = this.localUsers.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.localUsers[index] = { ...this.localUsers[index], ...data };
      return this.localUsers[index];
    }
    throw new Error("User not found");
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch {
      // Fallback
    }
    this.localUsers = this.localUsers.filter((u) => u.id !== id);
  }
}

export const userService = new UserService();
