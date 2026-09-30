import { apiClient } from "../../../lib/api-client";
import { DashboardApiResponse } from "../types/index";

export class DashboardService {
  async getDashboard(month?: string): Promise<DashboardApiResponse> {
    const endpoint = month ? `/dashboard?month=${encodeURIComponent(month)}` : "/dashboard";
    const response = await apiClient.get<DashboardApiResponse>(endpoint);
    if (!response.data) {
      throw new Error("Invalid response received from dashboard API");
    }
    return response.data;
  }
}

export const dashboardService = new DashboardService();
