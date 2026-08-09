import { MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  inverse = false,
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm shadow-primary/20",
          inverse && "bg-white text-primary",
        )}
      >
        <MessageSquare className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-base leading-none font-semibold tracking-[-0.02em] text-slate-950",
            inverse && "text-white",
          )}
        >
          ConnectSphere
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-1 block text-[10px] leading-none font-bold tracking-[0.14em] text-primary uppercase",
              inverse && "text-emerald-200",
            )}
          >
            Careers
          </span>
        ) : null}
      </span>
    </span>
  );
}
