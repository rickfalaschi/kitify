import { z } from "zod";

export const createKitSchema = z.object({
  name: z.string().min(2, "Kit name is required"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variationId: z.string().uuid().optional(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Add at least one product to the kit"),
});

export type CreateKitInput = z.infer<typeof createKitSchema>;
