"use client";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVote } from "@/features/post-actions";

export function VoteButton({
  postId,
  count,
  voted,
  canVote,
}: {
  postId: string;
  count: number;
  voted: boolean;
  canVote: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Optimistic: flip the count and state immediately; the server action + cache
  // revalidation reconcile on completion.
  const [state, setState] = useOptimistic({ count, voted }, (prev) => ({
    voted: !prev.voted,
    count: prev.count + (prev.voted ? -1 : 1),
  }));

  return (
    <div className={`vote${state.voted ? " voted" : ""}`}>
      <span className="count">{state.count}</span>
      <button
        type="button"
        aria-pressed={state.voted}
        disabled={!canVote}
        title={canVote ? "Toggle your vote" : "Sign in to vote"}
        onClick={() =>
          startTransition(async () => {
            setState(undefined);
            await toggleVote(postId);
            router.refresh();
          })
        }
      >
        ▲
      </button>
    </div>
  );
}
