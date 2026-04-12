import { z } from "zod";

export const placeOrderSchema = z.discriminatedUnion("deliveryType", [
  z.object({
    kitId: z.string().uuid(),
    deliveryType: z.literal("company_address"),
    companyAddressId: z.string().uuid(),
  }),
  z.object({
    kitId: z.string().uuid(),
    deliveryType: z.literal("employee_address"),
    employeeName: z.string().min(1, "Employee name is required"),
    employeeAddressLine1: z.string().min(1, "Address line 1 is required"),
    employeeAddressLine2: z.string().optional(),
    employeeCity: z.string().min(1, "City is required"),
    employeeCounty: z.string().optional(),
    employeePostcode: z.string().min(5, "Invalid postcode"),
  }),
]);

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
