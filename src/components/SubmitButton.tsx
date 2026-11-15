"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="primary" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
