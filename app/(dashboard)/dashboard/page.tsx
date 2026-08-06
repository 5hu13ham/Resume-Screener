import Link from "next/link";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import {
  formatRecommendation,
  recommendationTone,
  scoreTone,
} from "@/src/presentation/lib/format";
import { cn } from "@/src/presentation/lib/cn";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const container = getContainer();
  const sessions = user
    ? await container.screeningRepository.listSessions(user.id)
    : [];
  const candidates = user
    ? await container.screeningRepository.listCandidates(user.id)
    : [];

  const top = candidates.filter((c) => c.evaluation).slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Dashboard
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 md:text-4xl">
          Who should you interview?
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Welcome back, {user?.fullName.split(" ")[0] ?? "recruiter"}. Run a
          screening to rank candidates against a job description.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-muted">Screenings</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {sessions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs text-muted">Candidates scored</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {candidates.filter((c) => c.evaluation).length}
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-2xl border border-brand bg-brand p-5 text-white transition hover:bg-brand-strong"
        >
          <p className="text-xs text-teal-100">Next action</p>
          <p className="mt-2 text-xl font-semibold">Start AI screening</p>
          <p className="mt-1 text-sm text-teal-50">
            Paste JD + upload PDF/DOCX resumes
          </p>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Top candidates</h2>
          <Link href="/candidates" className="text-sm text-brand hover:underline">
            View all
          </Link>
        </div>
        {top.length ? (
          <div className="space-y-2">
            {top.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/candidates/${candidate.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-brand md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {candidate.extraction?.name ?? candidate.sourceFilename}
                  </p>
                  <p className="text-xs text-muted">Rank #{candidate.rank ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      scoreTone(candidate.evaluation?.overallMatchScore),
                    )}
                  >
                    {candidate.evaluation?.overallMatchScore}/100
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium",
                      recommendationTone(candidate.evaluation?.hiringRecommendation),
                    )}
                  >
                    {formatRecommendation(candidate.evaluation?.hiringRecommendation)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-muted">
            No scored candidates yet.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Recent screenings</h2>
        {sessions.length ? (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                href={`/screenings/${session.id}`}
                className="block rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-brand"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{session.title}</p>
                  <span className="text-xs capitalize text-muted">{session.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-muted">
            Create your first screening from Upload.
          </p>
        )}
      </section>
    </div>
  );
}
