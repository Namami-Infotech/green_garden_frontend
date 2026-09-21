import { apiClient } from "../../../lib/api-client";
import { CreateFlatData, FlatFilterOptions, FlatItem } from "../types/index";

const initialMockFlats: FlatItem[] = [
  {
    id: 1,
    flatNumber: "101",
    blockId: 1,
    floor: 1,
    flatType: "2BHK",
    occupancyStatus: "OWNER_OCCUPIED",
    ownerId: 1,
    residentId: 1,
    blockName: "Tower A (Emerald)",
    ownerName: "Ramesh Sharma",
    residentName: "Ramesh Sharma",
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-01-05T00:00:00Z",
  },
  {
    id: 2,
    flatNumber: "102",
    blockId: 1,
    floor: 1,
    flatType: "3BHK",
    occupancyStatus: "TENANT_OCCUPIED",
    ownerId: 2,
    residentId: 3,
    blockName: "Tower A (Emerald)",
    ownerName: "Pooja Verma",
    residentName: "Amit Patel",
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-01-05T00:00:00Z",
  },
  {
    id: 3,
    flatNumber: "201",
    blockId: 1,
    floor: 2,
    flatType: "2BHK",
    occupancyStatus: "VACANT",
    blockName: "Tower A (Emerald)",
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-01-05T00:00:00Z",
  },
  {
    id: 4,
    flatNumber: "501",
    blockId: 2,
    floor: 5,
    flatType: "PENTHOUSE",
    occupancyStatus: "OWNER_OCCUPIED",
    ownerId: 4,
    residentId: 4,
    blockName: "Tower B (Sapphire)",
    ownerName: "Sunita Iyer",
    residentName: "Sunita Iyer",
    createdAt: "2026-01-08T00:00:00Z",
    updatedAt: "2026-01-08T00:00:00Z",
  },
];

export class FlatService {
  private localFlats: FlatItem[] = [...initialMockFlats];

  async getFlats(filters?: FlatFilterOptions): Promise<{ flats: FlatItem[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.blockId) queryParams.append("blockId", String(filters.blockId));
      if (filters?.occupancyStatus) queryParams.append("occupancyStatus", filters.occupancyStatus);
      if (filters?.flatType) queryParams.append("flatType", filters.flatType);
      if (filters?.search) queryParams.append("search", filters.search);

      const endpoint = `/flats${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await apiClient.get<{ flats: FlatItem[]; meta: { total: number } }>(endpoint);
      if (response.data) {
        return { flats: response.data.flats, total: response.data.meta.total };
      }
    } catch {
      // Fallback
    }

    let result = [...this.localFlats];
    if (filters?.blockId) result = result.filter((f) => f.blockId === filters.blockId);
    if (filters?.occupancyStatus) result = result.filter((f) => f.occupancyStatus === filters.occupancyStatus);
    if (filters?.flatType) result = result.filter((f) => f.flatType === filters.flatType);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.flatNumber.toLowerCase().includes(q) ||
          f.ownerName?.toLowerCase().includes(q) ||
          f.residentName?.toLowerCase().includes(q)
      );
    }

    return { flats: result, total: result.length };
  }

  async createFlat(data: CreateFlatData): Promise<FlatItem> {
    try {
      const response = await apiClient.post<FlatItem>("/flats", data);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const newFlat: FlatItem = {
      id: Date.now(),
      flatNumber: data.flatNumber,
      blockId: data.blockId,
      floor: data.floor,
      flatType: data.flatType,
      occupancyStatus: data.occupancyStatus,
      ownerId: data.ownerId,
      residentId: data.residentId,
      blockName: `Tower ${data.blockId === 1 ? "A" : data.blockId === 2 ? "B" : "C"}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.localFlats.unshift(newFlat);
    return newFlat;
  }

  async updateFlat(id: number, data: Partial<CreateFlatData>): Promise<FlatItem> {
    try {
      const response = await apiClient.put<FlatItem>(`/flats/${id}`, data);
      if (response.data) return response.data;
    } catch {
      // Fallback
    }

    const index = this.localFlats.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.localFlats[index] = {
        ...this.localFlats[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return this.localFlats[index];
    }
    throw new Error("Flat not found");
  }

  async deleteFlat(id: number): Promise<void> {
    try {
      await apiClient.delete(`/flats/${id}`);
    } catch {
      // Fallback
    }
    this.localFlats = this.localFlats.filter((f) => f.id !== id);
  }
}

export const flatService = new FlatService();
