import type { RecruiterDecision } from "@/src/domain/entities/screening";
import { cn } from "@/src/presentation/lib/cn";

function recommendationTone(value: RecruiterDecision["recommendation"]) {
  switch (value) {
    case "Strong Interview":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Interview":
      return "border-teal-200 bg-teal-50 text-teal-800";
    case "Maybe":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Reject":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function confidenceTone(value: RecruiterDecision["confidence"]) {
  switch (value) {
    case "High":
      return "border-emerald-200 bg-white text-emerald-700";
    case "Medium":
      return "border-amber-200 bg-white text-amber-700";
    case "Low":
      return "border-slate-200 bg-white text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

type RecruiterDecisionCardProps = {
  decision: RecruiterDecision;
};

export function RecruiterDecisionCard({ decision }: RecruiterDecisionCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">AI review guidance</h2>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
              recommendationTone(decision.recommendation),
            )}
          >
            {decision.recommendation === "Reject" ? "Needs human review" : decision.recommendation}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
              confidenceTone(decision.confidence),
            )}
          >
            Confidence: {decision.confidence}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">Uncalibrated AI suggestions for interview preparation; never an automatic hiring decision.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Strengths
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {decision.strengths.length ? (
              decision.strengths.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-muted">None listed</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Gaps
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {decision.gaps.length ? (
              decision.gaps.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-amber-600">⚠</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-muted">No material gaps</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Interview Focus
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {decision.interviewFocus.length ? (
              decision.interviewFocus.map((item) => (
                <li key={item}>• {item}</li>
              ))
            ) : (
              <li className="text-muted">None listed</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
