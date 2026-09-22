import { z } from "zod";

export const transactionFormValidationSchema = z.object({
  payerName: z.string().min(2, "Payer name is required"),
  flatId: z.number().optional(),
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Must be a valid positive amount"),
  transactionType: z.enum(["MAINTENANCE", "SECURITY_CHARGE", "PENALTY", "EVENT", "WATER", "OTHER"]),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"]),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
  fromMonth: z.string().optional(),
  toMonth: z.string().optional(),
});
