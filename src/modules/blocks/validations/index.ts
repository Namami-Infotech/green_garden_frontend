import { z } from "zod";

export const blockValidationSchema = z.object({
  name: z.string().min(1, "Tower/Block name is required").max(100),
  description: z.string().max(255).optional(),
  totalFloors: z.number().int().min(1, "Total floors must be at least 1"),
});
