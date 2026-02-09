import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[hsl(var(--status-pending))]/15 text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending))]/30" },
  processing: { label: "Processing", className: "bg-[hsl(var(--status-processing))]/15 text-[hsl(var(--status-processing))] border-[hsl(var(--status-processing))]/30" },
  completed: { label: "Completed", className: "bg-[hsl(var(--status-completed))]/15 text-[hsl(var(--status-completed))] border-[hsl(var(--status-completed))]/30" },
  failed: { label: "Failed", className: "bg-[hsl(var(--status-failed))]/15 text-[hsl(var(--status-failed))] border-[hsl(var(--status-failed))]/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.className)}>
      {config.label}
    </span>
  );
}
