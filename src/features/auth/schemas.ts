import { z } from "zod";
import type { TFunction } from "i18next";

export const loginSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().min(1, t("auth.emailRequired")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

export const registerSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().email(t("auth.invalidEmail")),
    password: z.string().min(8, t("auth.passwordMin")),
  });

export type LoginFields = z.infer<ReturnType<typeof loginSchema>>;
export type RegisterFields = z.infer<ReturnType<typeof registerSchema>>;
