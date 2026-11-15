import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { comments, posts, users, votes } from "@/db/schema";
import type { Status } from "@/lib/validation";

/**
 * Pure data-access layer: plain async functions over a Drizzle database, with
 * no Next.js imports. This is the part worth testing against a real database,
 * so it lives apart from the caching/revalidation wrappers that wrap it.
 */

export interface PostListItem {
  id: string;
  title: string;
  status: Status;
  author: string;
  voteCount: number;
  commentCount: number;
  createdAt: string;
}

const voteCount = (pid = posts.id) =>
  sql<number>`(select count(*)::int from ${votes} where ${votes.postId} = ${pid})`;
const commentCount = (pid = posts.id) =>
  sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${pid})`;

export async function listBoard(db: Database): Promise<PostListItem[]> {
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      author: users.name,
      createdAt: posts.createdAt,
      voteCount: voteCount(),
      commentCount: commentCount(),
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .orderBy(
      desc(sql`(select count(*) from ${votes} where ${votes.postId} = ${posts.id})`),
      desc(posts.createdAt),
    );
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export interface PostDetail extends PostListItem {
  body: string;
  comments: { id: string; author: string; body: string; createdAt: string }[];
}

export async function getPostById(db: Database, id: string): Promise<PostDetail | null> {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      status: posts.status,
      author: users.name,
      createdAt: posts.createdAt,
      voteCount: voteCount(),
      commentCount: commentCount(),
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.id, id))
    .limit(1);
  if (!post) return null;

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      author: users.name,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.postId, id))
    .orderBy(desc(comments.createdAt));

  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    comments: commentRows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
  };
}

export async function hasVoted(db: Database, postId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ p: votes.postId })
    .from(votes)
    .where(and(eq(votes.postId, postId), eq(votes.userId, userId)))
    .limit(1);
  return Boolean(row);
}

/** Returns the new vote state (true = now voted). */
export async function toggleVote(db: Database, postId: string, userId: string): Promise<boolean> {
  if (await hasVoted(db, postId, userId)) {
    await db.delete(votes).where(and(eq(votes.postId, postId), eq(votes.userId, userId)));
    return false;
  }
  await db.insert(votes).values({ postId, userId });
  return true;
}

export async function setStatus(db: Database, postId: string, status: Status): Promise<void> {
  await db.update(posts).set({ status }).where(eq(posts.id, postId));
}
