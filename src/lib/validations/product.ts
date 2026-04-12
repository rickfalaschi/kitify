import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  basePrice: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
    message: "Invalid price",
  }),
});

export const createVariationSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["color", "size"]),
  value: z.string().min(1, "Value is required"),
  priceAdjustment: z
    .string()
    .refine((v) => !isNaN(Number(v)), { message: "Invalid value" })
    .optional(),
});
