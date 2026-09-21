export type FlatType = "1BHK" | "2BHK" | "3BHK" | "4BHK" | "PENTHOUSE" | "STUDIO";
export type OccupancyStatus = "VACANT" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED";

export interface FlatItem {
  id: number;
  flatNumber: string;
  blockId: number;
  floor: number;
  flatType: FlatType;
  occupancyStatus: OccupancyStatus;
  ownerId?: number | null;
  residentId?: number | null;
  createdAt: string;
  updatedAt: string;
  blockName?: string;
  ownerName?: string | null;
  residentName?: string | null;
}

export interface CreateFlatData {
  flatNumber: string;
  blockId: number;
  floor: number;
  flatType: FlatType;
  occupancyStatus: OccupancyStatus;
  ownerId?: number | null;
  residentId?: number | null;
  ownerName?: string | null;
  residentName?: string | null;
}

export type UpdateFlatData = Partial<CreateFlatData>;

export interface FlatFilterOptions {
  blockId?: number;
  occupancyStatus?: OccupancyStatus;
  flatType?: FlatType;
  search?: string;
}
