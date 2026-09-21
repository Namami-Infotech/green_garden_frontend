import { z } from "zod";

export const societySettingsValidationSchema = z.object({
  societyName: z.string().min(2, "Society name is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  monthlyMaintenanceRate: z.string().min(1, "Maintenance rate is required"),
  monthlySecurityCharge: z.string().min(1, "Security charge per month is required"),
  latePaymentPenaltyPercent: z.string().min(1, "Late penalty is required"),
  visitorPassRequired: z.string(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});
