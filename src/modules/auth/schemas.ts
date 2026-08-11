import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must contain at least 2 characters")
      .max(100),
    email: z
      .string()
      .trim()
      .pipe(z.email("Enter a valid email address"))
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(6, "Password must contain at least 6 characters")
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.input<typeof loginSchema>;
export type RegistrationInput = z.input<typeof registrationSchema>;
