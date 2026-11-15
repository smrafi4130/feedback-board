import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, hasVoted } from "@/features/posts-queries";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";
import { VoteButton } from "@/components/VoteButton";
import { CommentForm } from "@/components/CommentForm";
import { AdminStatusControl } from "@/components/AdminStatusControl";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await getPost(id);
  if (!post) notFound();

  const voted = user ? await hasVoted(post.id, user.id) : false;

  return (
    <article>
      <Link href="/" className="meta">
        ← Back to board
      </Link>
      <div className="post card" style={{ marginTop: 12 }}>
        <VoteButton postId={post.id} count={post.voteCount} voted={voted} canVote={Boolean(user)} />
        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>{post.title}</h1>
            <StatusBadge status={post.status} />
          </div>
          <p className="meta">by {post.author}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>
          {user?.role === "admin" ? (
            <AdminStatusControl postId={post.id} current={post.status} />
          ) : null}
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: "1.1rem" }}>
          {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
        </h2>
        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="muted">
            <Link href="/login">Sign in</Link> to comment.
          </p>
        )}
        <ul className="stack" style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {post.comments.map((c) => (
            <li key={c.id} className="card">
              <p className="meta" style={{ marginTop: 0 }}>
                {c.author}
              </p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
