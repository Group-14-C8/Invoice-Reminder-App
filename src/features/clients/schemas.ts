import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Enter a client name."),
  email: z.string().trim().email("Enter a valid email address."),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
