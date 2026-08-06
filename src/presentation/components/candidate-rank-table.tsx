import Link from "next/link";

import type { Candidate } from "@/src/domain/entities/screening";
import {
  formatRecommendation,
  recommendationTone,
  scoreTone,
} from "@/src/presentation/lib/format";
import { cn } from "@/src/presentation/lib/cn";

type CandidateRankTableProps = {
  candidates: Candidate[];
};

export function CandidateRankTable({ candidates }: CandidateRankTableProps) {
  if (!candidates.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-muted">
        No candidates yet for this screening.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Rank</th>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Overall</th>
            <th className="px-4 py-3 font-semibold">Skills</th>
            <th className="px-4 py-3 font-semibold">Recommendation</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const name =
              candidate.extraction?.name ?? candidate.sourceFilename.replace(/\.[^.]+$/, "");
            return (
              <tr key={candidate.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {candidate.rank ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {name}
                  </Link>
                  <p className="text-xs text-muted">{candidate.sourceFilename}</p>
                </td>
                <td
                  className={cn(
                    "px-4 py-3 font-semibold",
                    scoreTone(candidate.evaluation?.overallMatchScore),
                  )}
                >
                  {candidate.evaluation?.overallMatchScore ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {candidate.evaluation?.skillMatchScore ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                      recommendationTone(candidate.evaluation?.hiringRecommendation),
                    )}
                  >
                    {formatRecommendation(candidate.evaluation?.hiringRecommendation)}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">
                  {candidate.status}
                  {candidate.errorMessage ? (
                    <p className="max-w-xs text-xs text-danger">{candidate.errorMessage}</p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
