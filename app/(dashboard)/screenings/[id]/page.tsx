import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import { CandidateRankTable } from "@/src/presentation/components/candidate-rank-table";
import { DemoBadge } from "@/src/presentation/components/demo-badge";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScreeningDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { id } = await params;
  const { screeningRepository } = getContainer();
  const session = await screeningRepository.getSession(user.id, id);
  if (!session) notFound();

  const candidates = await screeningRepository.listCandidatesBySession(user.id, id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Ranking
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
              {session.title}
            </h1>
            {session.isDemo ? <DemoBadge /> : null}
          </div>
          <p className="text-sm text-muted">
            Status: <span className="capitalize">{session.status}</span> ·{" "}
            {candidates.length} candidate{candidates.length === 1 ? "" : "s"}
            {session.isDemo ? " · Sample data" : ""}
          </p>
          {session.errorMessage ? (
            <p className="text-sm text-danger">{session.errorMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/sessions/${session.id}/report`}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Download PDF report
          </a>
          <Link
            href="/upload"
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            New screening
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-slate-50 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Job description</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {session.jobDescription}
        </p>
      </section>

      <CandidateRankTable candidates={candidates} />
    </div>
  );
}
