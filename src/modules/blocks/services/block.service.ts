import { apiClient } from "../../../lib/api-client";
import { BlockItem, CreateBlockData, UpdateBlockData } from "../types/index";

const initialMockBlocks: BlockItem[] = [
  {
    id: 1,
    name: "Tower A (Emerald)",
    description: "East-facing premium residential tower with garden views",
    totalFloors: 14,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Tower B (Sapphire)",
    description: "Central high-rise with penthouse suites",
    totalFloors: 18,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Tower C (Ruby)",
    description: "West-wing tower near clubhouse & amenities",
    totalFloors: 12,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

export class BlockService {
  private localBlocks: BlockItem[] = [...initialMockBlocks];

  async getBlocks(): Promise<BlockItem[]> {
    try {
      const response = await apiClient.get<BlockItem[]>("/blocks");
      if (response.data) return response.data;
    } catch {
      // Fallback
    }
    return [...this.localBlocks];
  }

  async createBlock(data: CreateBlockData): Promise<BlockItem> {
    try {
      const response = await apiClient.post<BlockItem>("/blocks", data);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const newBlock: BlockItem = {
      id: Date.now(),
      name: data.name,
      description: data.description || "",
      totalFloors: data.totalFloors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.localBlocks.push(newBlock);
    return newBlock;
  }

  async updateBlock(id: number, data: UpdateBlockData): Promise<BlockItem> {
    try {
      const response = await apiClient.put<BlockItem>(`/blocks/${id}`, data);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const idx = this.localBlocks.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.localBlocks[idx] = { ...this.localBlocks[idx], ...data, updatedAt: new Date().toISOString() };
      return this.localBlocks[idx];
    }
    throw new Error("Block not found");
  }

  async deleteBlock(id: number): Promise<void> {
    try {
      await apiClient.delete(`/blocks/${id}`);
    } catch {
      // Fallback
    }
    this.localBlocks = this.localBlocks.filter((b) => b.id !== id);
  }
}

export const blockService = new BlockService();
