import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(100).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Message must contain at least 10 characters")
    .max(3000),
});
