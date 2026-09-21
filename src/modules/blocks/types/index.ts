export interface BlockItem {
  id: number;
  name: string;
  description?: string | null;
  totalFloors: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockData {
  name: string;
  description?: string;
  totalFloors: number;
}

export interface UpdateBlockData {
  name?: string;
  description?: string;
  totalFloors?: number;
}
