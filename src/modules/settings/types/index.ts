export interface SettingItem {
  id: number;
  key: string;
  value: string;
  group: string;
  description?: string | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSettingData {
  key: string;
  value: string;
  group?: string;
  description?: string;
}

export interface SocietyConfigState {
  societyName: string;
  registrationNumber: string;
  monthlyMaintenanceRate: string;
  monthlySecurityCharge: string;
  latePaymentPenaltyPercent: string;
  visitorPassRequired: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}
