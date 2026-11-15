"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/features/auth-actions";
import { SubmitButton } from "./SubmitButton";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export function AuthForm({ mode, action }: { mode: "login" | "signup"; action: Action }) {
  const [state, formAction] = useActionState(action, {});
  const isSignup = mode === "signup";
  return (
    <div className="auth card">
      <h1 style={{ marginTop: 0 }}>{isSignup ? "Create an account" : "Sign in"}</h1>
      <form action={formAction}>
        {isSignup ? (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" autoComplete="name" required />
            {state.errors?.name ? <span className="err">{state.errors.name}</span> : null}
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
          {state.errors?.email ? <span className="err">{state.errors.email}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />
          {state.errors?.password ? <span className="err">{state.errors.password}</span> : null}
        </div>
        {state.message ? <p className="form-error">{state.message}</p> : null}
        <SubmitButton>{isSignup ? "Sign up" : "Sign in"}</SubmitButton>
      </form>
      <p className="meta" style={{ marginBottom: 0 }}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        )}
      </p>
    </div>
  );
}
