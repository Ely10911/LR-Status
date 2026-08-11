import {
  STATUS_CONFIG,
  type LRStatus,
} from "@/lib/lr";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LRStatus;
  className?: string;
}

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.badge,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
