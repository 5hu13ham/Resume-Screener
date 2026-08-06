import Link from "next/link";

import type { Candidate, ScreeningSession } from "@/src/domain/entities/screening";
import { RetryButton } from "@/src/presentation/components/retry-button";
import { ScoreBar } from "@/src/presentation/components/score-bar";
import {
  formatRecommendation,
  recommendationTone,
} from "@/src/presentation/lib/format";
import { cn } from "@/src/presentation/lib/cn";

type CandidateDetailProps = {
  candidate: Candidate;
  session: ScreeningSession | null;
};

export function CandidateDetailView({ candidate, session }: CandidateDetailProps) {
  const extraction = candidate.extraction;
  const evaluation = candidate.evaluation;
  const name = extraction?.name ?? candidate.sourceFilename;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Candidate detail
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
            {name}
          </h1>
          <p className="text-sm text-muted">
            Rank #{candidate.rank ?? "—"}
            {session ? (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/screenings/${session.id}`}
                  className="text-brand hover:underline"
                >
                  {session.title}
                </Link>
              </>
            ) : null}
          </p>
          {evaluation ? (
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                recommendationTone(evaluation.hiringRecommendation),
              )}
            >
              {formatRecommendation(evaluation.hiringRecommendation)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/candidates/${candidate.id}/report`}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Download PDF report
          </a>
          {(candidate.status === "failed" || !evaluation) && (
            <RetryButton candidateId={candidate.id} />
          )}
        </div>
      </header>

      {candidate.errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {candidate.errorMessage}
        </p>
      ) : null}

      {evaluation ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800">Match scores</h2>
            <ScoreBar
              label="Overall match"
              score={evaluation.overallMatchScore}
              reason={evaluation.reasoning.overall}
            />
            <ScoreBar
              label="Skill match"
              score={evaluation.skillMatchScore}
              reason={evaluation.reasoning.skills}
            />
            <ScoreBar
              label="Experience match"
              score={evaluation.experienceMatchScore}
              reason={evaluation.reasoning.experience}
            />
            <ScoreBar
              label="Education match"
              score={evaluation.educationMatchScore}
              reason={evaluation.reasoning.education}
            />
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800">Executive summary</h2>
            <p className="text-sm leading-6 text-slate-700">
              {evaluation.executiveSummary}
            </p>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Employment gaps
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {evaluation.employmentGapDetection.notes}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Job hopper signal
              </h3>
              <p className="mt-1 text-sm text-slate-700">
                {evaluation.jobHopperDetection.notes}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {evaluation ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Strengths", evaluation.strengths],
            ["Weaknesses", evaluation.weaknesses],
            ["Missing skills", evaluation.missingSkills],
            ["Transferable skills", evaluation.transferableSkills],
          ].map(([title, items]) => (
            <div
              key={title as string}
              className="rounded-2xl border border-border bg-white p-5"
            >
              <h2 className="text-sm font-semibold text-slate-800">{title as string}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {(items as string[]).length ? (
                  (items as string[]).map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li className="text-muted">None listed</li>
                )}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {evaluation ? (
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">
            Recommended interview questions
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {evaluation.recommendedInterviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {extraction ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-800">Parsed profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Email</dt>
                <dd>{extraction.contact.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{extraction.contact.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">LinkedIn</dt>
                <dd>{extraction.contact.linkedin ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Experience</dt>
                <dd>
                  {extraction.experienceYears != null
                    ? `${extraction.experienceYears} years`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Skills</dt>
                <dd>{extraction.skills.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Certifications</dt>
                <dd>{extraction.certifications.join(", ") || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Education</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {extraction.education.length ? (
                  extraction.education.map((edu) => (
                    <li key={`${edu.degree}-${edu.institution}`}>
                      • {edu.degree} — {edu.institution}
                      {edu.year ? ` (${edu.year})` : ""}
                    </li>
                  ))
                ) : (
                  <li className="text-muted">None parsed</li>
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Projects</h2>
              <ul className="mt-3 space-y-3 text-sm text-slate-700">
                {extraction.projects.length ? (
                  extraction.projects.map((project) => (
                    <li key={project.name}>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-muted">{project.description}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-muted">None parsed</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
