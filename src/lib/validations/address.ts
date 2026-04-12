import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Address label is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  county: z.string().optional(),
  postcode: z.string().min(5, "Invalid postcode").max(10, "Invalid postcode"),
});

export type AddressInput = z.infer<typeof addressSchema>;
