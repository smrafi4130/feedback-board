"use client";
import { useActionState } from "react";
import { createPost } from "@/features/post-actions";
import { SubmitButton } from "./SubmitButton";

export function NewPostForm() {
  const [state, formAction] = useActionState(createPost, {});
  return (
    <form action={formAction} className="card">
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required />
        {state.errors?.title ? <span className="err">{state.errors.title}</span> : null}
      </div>
      <div className="field">
        <label htmlFor="body">Details</label>
        <textarea id="body" name="body" rows={5} required />
        {state.errors?.body ? <span className="err">{state.errors.body}</span> : null}
      </div>
      {state.message ? <p className="form-error">{state.message}</p> : null}
      <SubmitButton>Submit post</SubmitButton>
    </form>
  );
}
