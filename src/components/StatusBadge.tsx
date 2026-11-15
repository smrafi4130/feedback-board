import type { Status } from "@/lib/validation";

const LABEL: Record<Status, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  declined: "Declined",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status ${status}`}>{LABEL[status]}</span>;
}
