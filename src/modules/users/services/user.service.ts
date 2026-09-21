import { apiClient } from "../../../lib/api-client";
import { CreateUserData, UpdateUserData, UserFilterOptions, UserItem } from "../types/index";

const initialMockUsers: UserItem[] = [
  {
    id: 1,
    name: "Ramesh Sharma",
    email: "secretary@society.com",
    phone: "+91 98765 43210",
    role: "SECRETARY",
    status: "ACTIVE",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: 2,
    name: "Pooja Verma",
    email: "accountant@society.com",
    phone: "+91 98111 22334",
    role: "ACCOUNTANT",
    status: "ACTIVE",
    createdAt: "2026-01-15T12:30:00Z",
  },
  {
    id: 3,
    name: "Amit Patel",
    email: "amit.patel@gmail.com",
    phone: "+91 99000 55443",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-02-01T14:15:00Z",
  },
  {
    id: 4,
    name: "Sunita Iyer",
    email: "sunita.iyer@outlook.com",
    phone: "+91 97222 88990",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2026-02-18T09:40:00Z",
  },
  {
    id: 5,
    name: "Bahadur Singh",
    email: "security@society.com",
    phone: "+91 98888 77665",
    role: "SECURITY",
    status: "ACTIVE",
    createdAt: "2026-02-20T08:00:00Z",
  },
];

export class UserService {
  private localUsers: UserItem[] = [...initialMockUsers];

  async getUsers(filters?: UserFilterOptions): Promise<{ users: UserItem[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append("role", filters.role);
      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.search) queryParams.append("search", filters.search);

      const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await apiClient.get<{ users: UserItem[]; meta: { total: number } }>(endpoint);
      if (response.data) {
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
