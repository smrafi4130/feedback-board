import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { schema, posts, users, comments, votes } from "@/db/schema";
import type { Database } from "@/db/client";
import { getPostById, listBoard, setStatus, toggleVote } from "./posts-repo";

/** A fresh in-memory Postgres per test, so cases are fully isolated. */
async function freshDb(): Promise<Database> {
  const pg = new PGlite();
  await pg.exec(readFileSync(join(process.cwd(), "src/db/schema.sql"), "utf8"));
  return drizzle(pg, { schema });
}

let db: Database;
let alice: string;
let bob: string;

beforeEach(async () => {
  db = await freshDb();
  const [a, b] = await db
    .insert(users)
    .values([
      { name: "Alice", email: "alice@example.com", passwordHash: "x" },
      { name: "Bob", email: "bob@example.com", passwordHash: "x" },
    ])
    .returning({ id: users.id });
  alice = a!.id;
  bob = b!.id;
});

describe("posts repository (against PGlite Postgres)", () => {
  it("orders the board by vote count, then recency", async () => {
    const [p1, p2, p3] = await db
      .insert(posts)
      .values([
        { title: "Dark mode", body: "please add dark mode", authorId: alice },
        { title: "CSV export", body: "export my data as csv", authorId: bob },
        { title: "Mobile app", body: "a native mobile app", authorId: alice },
      ])
      .returning({ id: posts.id });

    await toggleVote(db, p2!.id, alice);
    await toggleVote(db, p2!.id, bob);
    await toggleVote(db, p3!.id, alice);

    const board = await listBoard(db);
    expect(board.map((p) => p.title)).toEqual(["CSV export", "Mobile app", "Dark mode"]);
    expect(board[0]).toMatchObject({ voteCount: 2, commentCount: 0, author: "Bob" });
    void p1;
  });

  it("toggles a vote and is idempotent per user", async () => {
    const [p] = await db
      .insert(posts)
      .values({ title: "Idea", body: "an idea here", authorId: alice })
      .returning({ id: posts.id });
    expect(await toggleVote(db, p!.id, bob)).toBe(true);
    expect(await toggleVote(db, p!.id, bob)).toBe(false); // second toggle removes it
    expect(await toggleVote(db, p!.id, bob)).toBe(true);
    const board = await listBoard(db);
    expect(board[0]!.voteCount).toBe(1);
  });

  it("enforces one vote per user per post at the database level", async () => {
    const [p] = await db
      .insert(posts)
      .values({ title: "Idea", body: "an idea here", authorId: alice })
      .returning({ id: posts.id });
    await db.insert(schema.votes).values({ postId: p!.id, userId: alice });
    await expect(
      db.insert(schema.votes).values({ postId: p!.id, userId: alice }),
    ).rejects.toThrow();
  });

  it("loads a post with its comments, newest first", async () => {
    const [p] = await db
      .insert(posts)
      .values({ title: "Idea", body: "the full body", authorId: alice })
      .returning({ id: posts.id });
    // Explicit, distinct timestamps so the "newest first" assertion can't depend
    // on two inserts landing in the same millisecond (which ties createdAt).
    await db.insert(comments).values({ postId: p!.id, authorId: bob, body: "first", createdAt: new Date("2026-01-01T00:00:00Z") });
    await db.insert(comments).values({ postId: p!.id, authorId: alice, body: "second", createdAt: new Date("2026-01-02T00:00:00Z") });

    const detail = await getPostById(db, p!.id);
    expect(detail).toMatchObject({ title: "Idea", body: "the full body", commentCount: 2 });
    expect(detail!.comments.map((c) => c.body)).toEqual(["second", "first"]);
  });

  it("cascades: deleting a post removes its votes and comments", async () => {
    const [p] = await db
      .insert(posts)
      .values({ title: "Idea", body: "an idea here", authorId: alice })
      .returning({ id: posts.id });
    await toggleVote(db, p!.id, alice);
    await db.insert(comments).values({ postId: p!.id, authorId: bob, body: "hi" });
    await db.delete(posts).where(eq(posts.id, p!.id));
    expect(await listBoard(db)).toHaveLength(0);
    const remainingVotes = await db.select().from(votes);
    const remainingComments = await db.select().from(comments);
    expect(remainingVotes).toHaveLength(0);
    expect(remainingComments).toHaveLength(0);
  });

  it("updates status", async () => {
    const [p] = await db
      .insert(posts)
      .values({ title: "Idea", body: "an idea here", authorId: alice })
      .returning({ id: posts.id });
    await setStatus(db, p!.id, "planned");
    expect((await getPostById(db, p!.id))!.status).toBe("planned");
  });
});
