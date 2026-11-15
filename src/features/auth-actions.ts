"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ensureReady } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";

export interface FormState {
  errors?: Record<string, string>;
  message?: string;
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const db = await ensureReady();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing.length > 0)
    return { errors: { email: "An account with this email already exists" } };

  const [created] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .returning({ id: users.id });
  await createSession(created!.id);
  redirect("/");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const db = await ensureReady();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  // Same generic error whether the email is unknown or the password is wrong,
  // so the form does not reveal which emails have accounts.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { message: "Invalid email or password" };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
