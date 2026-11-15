import "server-only";
import { unstable_cache } from "next/cache";
import { ensureReady } from "@/db/client";
import { getPostById, hasVoted as repoHasVoted, listBoard } from "./posts-repo";

export const CACHE_TAG = "posts";
export type { PostListItem, PostDetail } from "./posts-repo";

/**
 * The board is read on every visit but changes only on a write, so it is cached
 * and tagged. Every mutation calls `revalidateTag(CACHE_TAG)`: fast reads, correct
 * after writes. (With PGlite the cache lives in the server process; the pattern is
 * what transfers to a production Postgres + shared cache.)
 */
export const getBoard = unstable_cache(async () => listBoard(await ensureReady()), ["board"], {
  tags: [CACHE_TAG],
});

export async function getPost(id: string) {
  return getPostById(await ensureReady(), id);
}

export async function hasVoted(postId: string, userId: string) {
  return repoHasVoted(await ensureReady(), postId, userId);
}
