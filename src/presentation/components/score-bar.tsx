import { cn } from "@/src/presentation/lib/cn";

type ScoreBarProps = {
  label: string;
  score: number;
  reason?: string;
};

export function ScoreBar({ label, score, reason }: ScoreBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{score}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 75
              ? "bg-emerald-500"
              : score >= 55
                ? "bg-amber-500"
                : "bg-rose-500",
          )}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      {reason ? <p className="text-xs leading-5 text-muted">{reason}</p> : null}
    </div>
  );
}
