import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Enter a client name.").max(200),
  email: z.string().trim().email("Enter a valid email address.").max(200),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
