import Link from "next/link";
import { getBoard } from "@/features/posts-queries";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";

export default async function BoardPage() {
  const [board, user] = await Promise.all([getBoard(), getCurrentUser()]);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Feature requests</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {board.length} {board.length === 1 ? "idea" : "ideas"}, most upvoted first.
          </p>
        </div>
        {user ? (
          <Link href="/new" className="btn primary">
            New post
          </Link>
        ) : (
          <Link href="/login" className="btn">
            Sign in to post
          </Link>
        )}
      </div>

      {board.length === 0 ? (
        <p className="card muted">No posts yet. Be the first to suggest something.</p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {board.map((post) => (
            <li key={post.id} className="card post">
              <div className="vote">
                <span className="count">{post.voteCount}</span>
                <span className="meta">votes</span>
              </div>
              <div style={{ flex: 1 }}>
                <h3>
                  <Link href={`/posts/${post.id}`}>{post.title}</Link>
                </h3>
                <div className="row" style={{ gap: 8 }}>
                  <StatusBadge status={post.status} />
                  <span className="meta">
                    by {post.author} · {post.commentCount}{" "}
                    {post.commentCount === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
