"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/features/post-actions";
import { STATUSES, type Status } from "@/lib/validation";

export function AdminStatusControl({ postId, current }: { postId: string; current: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="row" style={{ gap: 8, marginTop: 12 }}>
      <span className="meta">Set status (admin):</span>
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setStatus(postId, e.target.value);
            router.refresh();
          })
        }
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
