import { z } from "zod";

export const flatValidationSchema = z.object({
  flatNumber: z.string().min(1, "Flat number is required").max(50),
  blockId: z.number().int().positive("Please select a block / tower"),
  floor: z.number().int().min(0, "Floor must be 0 or higher"),
  flatType: z.enum(["1BHK", "2BHK", "3BHK", "4BHK", "PENTHOUSE", "STUDIO"]).optional().default("2BHK"),
  occupancyStatus: z.enum(["VACANT", "OWNER_OCCUPIED", "TENANT_OCCUPIED"]).optional().default("VACANT"),
  ownerId: z.number().int().positive().nullable().optional(),
  residentId: z.number().int().positive().nullable().optional(),
});
