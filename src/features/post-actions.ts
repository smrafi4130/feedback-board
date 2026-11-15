"use server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { ensureReady } from "@/db/client";
import { comments, posts } from "@/db/schema";
import * as repo from "./posts-repo";
import { requireUser } from "@/lib/session";
import { CACHE_TAG } from "./posts-queries";
import { commentSchema, fieldErrors, postSchema, statusSchema } from "@/lib/validation";
import type { FormState } from "./auth-actions";

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser().catch(() => null);
  if (!user) return { message: "Please sign in to post." };

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const db = await ensureReady();
  const [created] = await db
    .insert(posts)
    .values({ title: parsed.data.title, body: parsed.data.body, authorId: user.id })
    .returning({ id: posts.id });
  revalidateTag(CACHE_TAG);
  redirect(`/posts/${created!.id}`);
}

/** Toggle the current user's vote on a post. Idempotent per user (DB unique index). */
export async function toggleVote(postId: string): Promise<void> {
  const user = await requireUser();
  const db = await ensureReady();
  await repo.toggleVote(db, postId, user.id);
  revalidateTag(CACHE_TAG);
}

export async function addComment(
  postId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser().catch(() => null);
  if (!user) return { message: "Please sign in to comment." };

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const db = await ensureReady();
  await db.insert(comments).values({ postId, authorId: user.id, body: parsed.data.body });
  revalidateTag(CACHE_TAG);
  return {};
}

/** Admin-only: change a post's status. Authorization is enforced here, server-side. */
export async function setStatus(postId: string, status: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  const parsed = statusSchema.parse(status);
  await repo.setStatus(await ensureReady(), postId, parsed);
  revalidateTag(CACHE_TAG);
}
