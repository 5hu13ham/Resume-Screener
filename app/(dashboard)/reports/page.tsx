import Link from "next/link";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";
import { getContainer } from "@/src/infrastructure/di/container";
import { DemoBadge } from "@/src/presentation/components/demo-badge";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const sessions = user
    ? await getContainer().screeningRepository.listSessions(user.id)
    : [];

  const completed = sessions.filter(
    (session) => session.status === "completed" || session.status === "failed",
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Reports
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
          Downloadable screening reports
        </h1>
        <p className="text-sm text-muted">
          Export ranked PDF reports for completed screening sessions.
        </p>
      </header>

      {completed.length ? (
        <div className="space-y-3">
          {completed.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{session.title}</h2>
                  {session.isDemo ? <DemoBadge /> : null}
                </div>
                <p className="text-xs text-muted">
                  {new Date(session.updatedAt).toLocaleString()} · {session.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/screenings/${session.id}`}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-slate-700"
                >
                  View ranking
                </Link>
                <a
                  href={`/api/sessions/${session.id}/report`}
                  className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
                >
                  Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-muted">
          No reports yet. Run a screening from Upload to generate one.
        </p>
      )}
    </div>
  );
}
