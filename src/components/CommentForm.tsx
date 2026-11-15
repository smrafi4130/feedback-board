"use client";
import { useActionState } from "react";
import { addComment } from "@/features/post-actions";
import { SubmitButton } from "./SubmitButton";

export function CommentForm({ postId }: { postId: string }) {
  const action = addComment.bind(null, postId);
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="card">
      <div className="field">
        <label htmlFor="comment">Add a comment</label>
        <textarea id="comment" name="body" rows={3} required />
        {state.errors?.body ? <span className="err">{state.errors.body}</span> : null}
      </div>
      {state.message ? <p className="form-error">{state.message}</p> : null}
      <SubmitButton>Comment</SubmitButton>
    </form>
  );
}
