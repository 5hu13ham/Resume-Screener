import Link from "next/link";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import { DemoBadge } from "@/src/presentation/components/demo-badge";
import { EmptyState } from "@/src/presentation/components/empty-state";
import { InstantDemoActions } from "@/src/presentation/components/instant-demo-actions";
import {
  SessionCard,
  buildSessionCardModel,
} from "@/src/presentation/components/session-card";
import {
  formatRecommendation,
  recommendationTone,
  scoreTone,
} from "@/src/presentation/lib/format";
import { cn } from "@/src/presentation/lib/cn";

function buildRecentActivity(
  sessions: Awaited<
    ReturnType<
      ReturnType<typeof getContainer>["screeningRepository"]["listSessions"]
    >
  >,
  candidates: Awaited<
    ReturnType<
      ReturnType<typeof getContainer>["screeningRepository"]["listCandidates"]
    >
  >,
) {
  const items: Array<{ id: string; text: string; href: string; at: string }> = [];

  for (const session of sessions.slice(0, 8)) {
    const count = candidates.filter((c) => c.sessionId === session.id).length;
    if (session.status === "completed") {
      items.push({
        id: `completed-${session.id}`,
        text: `Completed “${session.title}” · ${count} candidate${count === 1 ? "" : "s"} ranked`,
        href: `/screenings/${session.id}`,
        at: session.updatedAt,
      });
    } else if (session.status === "uploaded" || session.status === "draft") {
      items.push({
        id: `draft-${session.id}`,
        text: `Started “${session.title}”`,
        href: `/screenings/${session.id}`,
        at: session.createdAt,
      });
    } else if (session.status === "failed") {
      items.push({
        id: `failed-${session.id}`,
        text: `Needs attention: “${session.title}”`,
        href: `/screenings/${session.id}`,
        at: session.updatedAt,
      });
    }
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      when: new Date(item.at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    }));
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const container = getContainer();
  const sessions = user
    ? await container.screeningRepository.listSessions(user.id)
    : [];
  const candidates = user
    ? await container.screeningRepository.listCandidates(user.id)
    : [];

  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const top = candidates.filter((c) => c.evaluation).slice(0, 5);
  const sessionCards = sessions
    .slice(0, 6)
    .map((session) => buildSessionCardModel(session, candidates));
  const recentActivity = buildRecentActivity(sessions, candidates);
  const isEmpty = sessions.length === 0 && candidates.length === 0;

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
          Welcome back, {user?.fullName.split(" ")[0] ?? "recruiter"}. Try the instant
          demo, or run a real screening with your own resumes.
        </p>
      </header>

      <InstantDemoActions />

      {isEmpty ? (
        <EmptyState
          title="No screenings yet"
          description="Create a screening with your job description and resumes, or try the instant demo to see ranked candidates in under a minute."
          primaryHref="/upload"
          primaryLabel="Create a screening"
          secondaryHref="/dashboard"
          secondaryLabel="Use Try Demo above"
        />
      ) : null}

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
          <h2 className="text-sm font-semibold text-slate-800">Your screenings</h2>
          <Link href="/upload" className="text-sm text-brand hover:underline">
            New screening
          </Link>
        </div>
        {sessionCards.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sessionCards.map((model) => (
              <SessionCard key={model.session.id} model={model} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No screening sessions yet"
            description="Once you run a screening, session cards with candidate counts and top scores will appear here."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Recent activity</h2>
        {recentActivity.length ? (
          <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
            {recentActivity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
              >
                <p className="text-sm text-slate-800">{item.text}</p>
                <p className="text-xs text-muted">{item.when}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-muted">
            Activity will appear here after your first screening or demo run.
          </p>
        )}
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
            {top.map((candidate) => {
              const isDemo = sessionById.get(candidate.sessionId)?.isDemo === true;
              return (
                <Link
                  key={candidate.id}
                  href={`/candidates/${candidate.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-brand md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {candidate.extraction?.name ?? candidate.sourceFilename}
                      </p>
                      <p className="text-xs text-muted">
                        Rank #{candidate.rank ?? "—"}
                      </p>
                    </div>
                    {isDemo ? <DemoBadge /> : null}
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
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No ranked candidates yet"
            description="Run a screening or try the instant demo to populate your shortlist."
            primaryLabel="Create a screening"
            secondaryLabel="Back to Try Demo"
          />
        )}
      </section>
    </div>
  );
}
