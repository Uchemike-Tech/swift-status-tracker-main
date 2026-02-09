import { Check, Clock, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTimelineSteps, getStatusStepIndex } from "@/lib/timeline";

interface TimelineEvent {
  step_name: string;
  step_order: number;
  status: string;
  completed_at: string | null;
}

interface TransferTimelineProps {
  method: string;
  status: string;
  events: TimelineEvent[];
}

export function TransferTimeline({ method, status, events }: TransferTimelineProps) {
  const steps = getTimelineSteps(method);
  const activeIndex = getStatusStepIndex(status);
  const isFailed = status === "failed";

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const event = events.find((e) => e.step_order === index);
        const isCompleted = !isFailed && index <= activeIndex && (status === "completed" || index < activeIndex);
        const isActive = !isFailed && index === activeIndex && status !== "completed";
        const isPending = !isCompleted && !isActive;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
                  isCompleted && "border-[hsl(var(--status-completed))] bg-[hsl(var(--status-completed))] text-white",
                  isActive && !isFailed && "border-[hsl(var(--status-processing))] bg-[hsl(var(--status-processing))]/10 text-[hsl(var(--status-processing))]",
                  isFailed && index === 0 && "border-[hsl(var(--status-failed))] bg-[hsl(var(--status-failed))] text-white",
                  isPending && !isFailed && "border-border bg-muted text-muted-foreground",
                  isFailed && index > 0 && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFailed && index === 0 ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[2rem] transition-all duration-500",
                    isCompleted ? "bg-[hsl(var(--status-completed))]" : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Content column */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "font-medium leading-9 transition-colors",
                  isCompleted && "text-foreground",
                  isActive && "text-[hsl(var(--status-processing))] font-semibold",
                  isPending && "text-muted-foreground",
                  isFailed && index === 0 && "text-[hsl(var(--status-failed))] font-semibold"
                )}
              >
                {step}
              </p>
              {event?.completed_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.completed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
