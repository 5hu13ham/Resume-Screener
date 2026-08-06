import Link from "next/link";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import { CandidateRankTable } from "@/src/presentation/components/candidate-rank-table";
import { EmptyState } from "@/src/presentation/components/empty-state";

export default async function CandidatesPage() {
  const user = await getCurrentUser();
  const candidates = user
    ? await getContainer().screeningRepository.listCandidates(user.id)
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Candidates
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
            All screened candidates
          </h1>
          <p className="text-sm text-muted">
            Ranked by overall match score across your screenings.
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Screen resumes
        </Link>
      </header>

      {candidates.length ? (
        <CandidateRankTable candidates={candidates} />
      ) : (
        <EmptyState
          title="No candidates to review yet"
          description="Create a screening with your job description and resumes, or try the instant demo from the dashboard to generate a ranked shortlist."
          primaryHref="/upload"
          primaryLabel="Create a screening"
          secondaryHref="/dashboard"
          secondaryLabel="Try Demo"
        />
      )}
    </div>
  );
}
