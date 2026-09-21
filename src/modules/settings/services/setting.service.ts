import { apiClient } from "../../../lib/api-client";
import { SocietyConfigState, SettingItem, UpsertSettingData } from "../types/index";

const defaultSettings: SettingItem[] = [
  { id: 1, key: "societyName", value: "Green Place Residential Society", group: "GENERAL", createdAt: "", updatedAt: "" },
  { id: 2, key: "registrationNumber", value: "CHS/MAH/BOM/2021/8892", group: "GENERAL", createdAt: "", updatedAt: "" },
  { id: 3, key: "monthlyMaintenanceRate", value: "3500", group: "MAINTENANCE", createdAt: "", updatedAt: "" },
  { id: 4, key: "monthlySecurityCharge", value: "500", group: "MAINTENANCE", createdAt: "", updatedAt: "" },
  { id: 5, key: "latePaymentPenaltyPercent", value: "18", group: "MAINTENANCE", createdAt: "", updatedAt: "" },
  { id: 6, key: "visitorPassRequired", value: "true", group: "SECURITY", createdAt: "", updatedAt: "" },
  { id: 7, key: "quietHoursStart", value: "22:00", group: "RULES", createdAt: "", updatedAt: "" },
  { id: 8, key: "quietHoursEnd", value: "07:00", group: "RULES", createdAt: "", updatedAt: "" },
];

export class SettingService {
  private localSettings: SettingItem[] = [...defaultSettings];

  async getSettings(): Promise<SocietyConfigState> {
    try {
      const res = await apiClient.get<SettingItem[]>("/settings");
      if (res.data && res.data.length > 0) {
        this.localSettings = res.data;
      }
    } catch {
      // Fallback
    }

    const map: Record<string, string> = {};
    for (const item of this.localSettings) {
      map[item.key] = item.value;
    }

    return {
      societyName: map.societyName || "Green Place Residential Society",
      registrationNumber: map.registrationNumber || "CHS/MAH/2021/8892",
      monthlyMaintenanceRate: map.monthlyMaintenanceRate || "3500",
      monthlySecurityCharge: map.monthlySecurityCharge || "500",
      latePaymentPenaltyPercent: map.latePaymentPenaltyPercent || "18",
      visitorPassRequired: map.visitorPassRequired || "true",
      quietHoursStart: map.quietHoursStart || "22:00",
      quietHoursEnd: map.quietHoursEnd || "07:00",
    };
  }

  async saveSettings(config: SocietyConfigState): Promise<void> {
    const list: UpsertSettingData[] = [
      { key: "societyName", value: config.societyName, group: "GENERAL" },
      { key: "registrationNumber", value: config.registrationNumber, group: "GENERAL" },
      { key: "monthlyMaintenanceRate", value: config.monthlyMaintenanceRate, group: "MAINTENANCE" },
      { key: "monthlySecurityCharge", value: config.monthlySecurityCharge, group: "MAINTENANCE" },
      { key: "latePaymentPenaltyPercent", value: config.latePaymentPenaltyPercent, group: "MAINTENANCE" },
      { key: "visitorPassRequired", value: config.visitorPassRequired, group: "SECURITY" },
      { key: "quietHoursStart", value: config.quietHoursStart, group: "RULES" },
      { key: "quietHoursEnd", value: config.quietHoursEnd, group: "RULES" },
    ];

    const res = await apiClient.put<SettingItem[]>("/settings/bulk", { settings: list });
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      this.localSettings = res.data;
    } else {
      for (const item of list) {
        const found = this.localSettings.find((s) => s.key === item.key);
        if (found) {
          found.value = item.value;
        } else {
          this.localSettings.push({
            id: Date.now(),
            key: item.key,
            value: item.value,
            group: item.group || "GENERAL",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}

export const settingService = new SettingService();
