import Link from "next/link";

import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import { DemoBadge } from "@/src/presentation/components/demo-badge";
import { scoreTone } from "@/src/presentation/lib/format";
import { cn } from "@/src/presentation/lib/cn";

export type SessionCardModel = {
  session: ScreeningSession;
  candidateCount: number;
  topScore: number | null;
};

export function buildSessionCardModel(
  session: ScreeningSession,
  candidates: Candidate[],
): SessionCardModel {
  const sessionCandidates = candidates.filter((c) => c.sessionId === session.id);
  const scores = sessionCandidates
    .map((c) => c.evaluation?.overallMatchScore)
    .filter((score): score is number => typeof score === "number");
  return {
    session,
    candidateCount: sessionCandidates.length,
    topScore: scores.length ? Math.max(...scores) : null,
  };
}

type SessionCardProps = {
  model: SessionCardModel;
};

export function SessionCard({ model }: SessionCardProps) {
  const { session, candidateCount, topScore } = model;
  const created = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/screenings/${session.id}`}
      className="block rounded-2xl border border-border bg-white p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{session.title}</h3>
            {session.isDemo ? <DemoBadge /> : null}
          </div>
          <p className="text-xs text-muted">
            {candidateCount} candidate{candidateCount === 1 ? "" : "s"} · Created{" "}
            {created}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] tracking-wide text-muted uppercase">Top score</p>
          <p className={cn("text-lg font-semibold", scoreTone(topScore))}>
            {topScore != null ? `${topScore}` : "—"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs capitalize text-slate-500">Status: {session.status}</p>
    </Link>
  );
}
