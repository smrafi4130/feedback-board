import { ensureReady } from "@/db/client";
import { comments, posts, users, votes } from "@/db/schema";
import { hashPassword } from "@/lib/password";

/**
 * Seeds a demo dataset. Set PGLITE_DATA to persist it to a directory the dev
 * server also uses (otherwise each process starts empty). Example:
 *   PGLITE_DATA=.pglite pnpm db:seed && PGLITE_DATA=.pglite pnpm dev
 */
async function main() {
  const db = await ensureReady();
  const pw = await hashPassword("password");
  const [admin, maya, sam] = await db
    .insert(users)
    .values([
      { name: "Ada Admin", email: "admin@example.com", passwordHash: pw, role: "admin" },
      { name: "Maya Member", email: "maya@example.com", passwordHash: pw },
      { name: "Sam User", email: "sam@example.com", passwordHash: pw },
    ])
    .returning({ id: users.id });

  const seedPosts = [
    {
      title: "Dark mode",
      body: "A dark theme that respects prefers-color-scheme.",
      authorId: maya!.id,
      status: "planned" as const,
    },
    {
      title: "CSV export of my data",
      body: "Let me export all my records as CSV from settings.",
      authorId: sam!.id,
      status: "open" as const,
    },
    {
      title: "Keyboard shortcuts",
      body: "j/k to move between items, v to vote.",
      authorId: maya!.id,
      status: "in_progress" as const,
    },
    {
      title: "Slack notifications",
      body: "Notify a Slack channel when status changes.",
      authorId: sam!.id,
      status: "open" as const,
    },
  ];
  const created = await db.insert(posts).values(seedPosts).returning({ id: posts.id });

  await db.insert(votes).values([
    { postId: created[0]!.id, userId: admin!.id },
    { postId: created[0]!.id, userId: sam!.id },
    { postId: created[2]!.id, userId: maya!.id },
    { postId: created[2]!.id, userId: admin!.id },
    { postId: created[2]!.id, userId: sam!.id },
  ]);
  await db.insert(comments).values([
    { postId: created[0]!.id, authorId: admin!.id, body: "On the roadmap for next month." },
    { postId: created[2]!.id, authorId: sam!.id, body: "Would love this." },
  ]);

  console.log("Seeded users (password: 'password'): admin@, maya@, sam@example.com");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
