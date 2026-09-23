import { apiClient } from "../../../lib/api-client";
import { BlockItem, CreateBlockData, UpdateBlockData } from "../types/index";

export class BlockService {
  async getBlocks(): Promise<BlockItem[]> {
    const response = await apiClient.get<BlockItem[]>("/blocks");
    return response.data || [];
  }

  async createBlock(data: CreateBlockData): Promise<BlockItem> {
    const response = await apiClient.post<BlockItem>("/blocks", data);
    if (!response.data) {
      throw new Error(response.message || "Failed to create block");
    }
    return response.data;
  }

  async updateBlock(id: number, data: UpdateBlockData): Promise<BlockItem> {
    const response = await apiClient.put<BlockItem>(`/blocks/${id}`, data);
    if (!response.data) {
      throw new Error(response.message || "Failed to update block");
    }
    return response.data;
  }

  async deleteBlock(id: number): Promise<void> {
    const response = await apiClient.delete(`/blocks/${id}`);
    if (response.success === false) {
      throw new Error(response.message || "Failed to delete block");
    }
  }
}

export const blockService = new BlockService();
