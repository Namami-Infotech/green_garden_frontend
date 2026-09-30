import { BlockItem } from "../../blocks/types/index";
import { FlatItem } from "../../flats/types/index";
import { UserItem } from "../../users/types/index";
import { TransactionItem } from "../../transactions/types/index";

export interface DashboardMonthFilter {
  selectedMonth: string;
  label: string;
  isCurrentCycle: boolean;
}

export interface DashboardStats {
  totalBlocks: number;
  totalFloors: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  occupancyRate: number;
  totalMembers: number;
  residentsCount: number;
  staffCount: number;
  maintenanceRate: number;
  securityCharge: number;
  combinedMonthlyRate: number;
  societyName: string;
  visitorPassRequired: string;
  quietHours: string;
}

export interface DashboardCards {
  thisMonthCollection: {
    amount: number;
    cycle: string;
    cash: { amount: number; percentage: number };
    online: { amount: number; percentage: number };
    totalTransactions: number;
    status: string;
  };
  todayCollection: {
    amount: number;
    count: number;
    cash: number;
    online: number;
  };
  pendingDues: {
    pendingAmount: number;
    expected: number;
    settledPercentage: number;
    pendingFlatsCount: number;
    status: string;
  };
  totalBlocks: {
    count: number;
    totalFloors: number;
    blocks: { id: number; name: string; totalFloors: number }[];
  };
  totalFlats: {
    total: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
  };
  totalMembers: {
    total: number;
    residents: number;
    staffAndManagement: number;
  };
}

export interface FeeBreakdown {
  monthlyMaintenanceRate: number;
  monthlySecurityCharge: number;
  combinedFlatFee: number;
  totalRevenueInflow: number;
  paidOccupiedUnits: number;
  feeDistributionRatio: string;
  baseMaintenance: {
    label: string;
    collected: number;
    percentage: number;
    monthlyRatePerFlat: number;
    count: number;
  };
  securityCharge: {
    label: string;
    collected: number;
    percentage: number;
    monthlyRatePerFlat: number;
    count: number;
  };
  otherCategories: {
    type: string;
    collected: number;
    count: number;
    percentage: number;
  }[];
  grandTotal: number;
}

export interface TowerInventoryItem {
  id: number;
  name: string;
  totalFloors: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  flats: {
    id: number;
    flatNumber: string;
    floor: number;
    occupancyStatus: string;
    residentName?: string | null;
    ownerName?: string | null;
  }[];
}

export interface PendingDueItem {
  flatId: number;
  flatNumber: string;
  blockName: string;
  payerName: string;
  payerId?: number | null;
  remainingAmount: number;
  type: "PENDING" | "PARTIAL";
}

export interface DashboardApiResponse {
  monthFilter: DashboardMonthFilter;
  stats: DashboardStats;
  cards: DashboardCards;
  feeBreakdown: FeeBreakdown;
  towersInventory: TowerInventoryItem[];
  recentPayments: TransactionItem[];
  pendingDuesList: {
    allCleared: boolean;
    pendingCount: number;
    items: PendingDueItem[];
  };
  raw: {
    blocks: BlockItem[];
    flats: FlatItem[];
    users: UserItem[];
    settings: Record<string, string>;
    transactions: TransactionItem[];
  };
}
