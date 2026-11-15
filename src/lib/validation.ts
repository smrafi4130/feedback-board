import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(120),
  body: z.string().trim().min(10, "Describe your idea in at least 10 characters").max(2000),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export const STATUSES = ["open", "planned", "in_progress", "done", "declined"] as const;
export const statusSchema = z.enum(STATUSES);
export type Status = (typeof STATUSES)[number];

/** Flatten a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
