import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { ensureReady } from "@/db/client";
import { sessions, users } from "@/db/schema";

const COOKIE = "fb_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
}

/** Create a session row and set an httpOnly, SameSite cookie (see ADR-0003). */
export async function createSession(userId: string): Promise<void> {
  const db = await ensureReady();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(sessions).values({ id: token, userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await ensureReady();
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  jar.delete(COOKIE);
}

/**
 * Current user, or null. `cache()` dedupes this within a single request, so
 * multiple server components can call it without extra queries.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = await ensureReady();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
