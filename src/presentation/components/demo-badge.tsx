import { cn } from "@/src/presentation/lib/cn";

type DemoBadgeProps = {
  className?: string;
};

export function DemoBadge({ className }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase",
        className,
      )}
    >
      Demo
    </span>
  );
}
