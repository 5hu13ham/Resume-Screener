"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { readApiErrorMessage } from "@/src/presentation/lib/friendly-errors";

type UploadedCandidate = {
  id: string;
  sourceFilename: string;
};

type ScreenResult = {
  session?: { id: string; title?: string };
  candidates?: Array<{
    id: string;
    rank: number | null;
    extraction?: { name?: string } | null;
    sourceFilename: string;
    evaluation?: { overallMatchScore?: number } | null;
  }>;
  error?: string;
};

type SuccessSummary = {
  sessionId: string;
  candidateCount: number;
  durationSeconds: number;
  topName: string;
  topScore: number | null;
};

export function ScreeningWizard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "idle" | "creating" | "uploading" | "screening" | "done"
  >("idle");
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [summary, setSummary] = useState<SuccessSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  function onFilesSelected(list: FileList | null) {
    setFiles(list ? Array.from(list) : []);
    setSummary(null);
    setError(null);
  }

  async function runWorkflow() {
    setError(null);
    setSummary(null);

    if (jobDescription.trim().length < 40) {
      setError("Please paste a clearer job description before screening.");
      return;
    }
    if (!files.length) {
      setError("Select one or more PDF or DOCX resumes to continue.");
      return;
    }

    const startedAt = Date.now();

    startTransition(async () => {
      try {
        setStep("creating");
        setProgressLabel("Creating your screening session…");
        const sessionRes = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || undefined,
            jobDescription,
          }),
        });
        const sessionJson = (await sessionRes.json()) as {
          session?: { id: string };
          error?: string;
        };
        if (!sessionRes.ok || !sessionJson.session) {
          throw new Error(
            readApiErrorMessage(
              sessionJson,
              "We couldn't create this screening. Please try again.",
            ),
          );
        }

        setStep("uploading");
        setProgressLabel(
          `Uploading ${files.length} resume${files.length === 1 ? "" : "s"}…`,
        );
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const uploadRes = await fetch(
          `/api/sessions/${sessionJson.session.id}/uploads`,
          { method: "POST", body: formData },
        );
        const uploadJson = (await uploadRes.json()) as {
          candidates?: UploadedCandidate[];
          error?: string;
        };
        if (!uploadRes.ok) {
          throw new Error(
            readApiErrorMessage(
              uploadJson,
              "We couldn't upload those resumes. Please use PDF or DOCX files.",
            ),
          );
        }

        setStep("screening");
        setProgressLabel(
          `Evaluating ${uploadJson.candidates?.length ?? files.length} candidates…`,
        );
        const screenRes = await fetch(
          `/api/sessions/${sessionJson.session.id}/screen`,
          { method: "POST" },
        );
        const screenJson = (await screenRes.json()) as ScreenResult;
        if (!screenRes.ok || !screenJson.session || !screenJson.candidates) {
          throw new Error(
            readApiErrorMessage(
              screenJson,
              "Screening didn't finish. You can retry from the dashboard.",
            ),
          );
        }

        const ranked = [...screenJson.candidates].sort(
          (a, b) => (a.rank ?? 999) - (b.rank ?? 999),
        );
        const top = ranked[0];
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - startedAt) / 1000),
        );

        setSummary({
          sessionId: screenJson.session.id,
          candidateCount: screenJson.candidates.length,
          durationSeconds,
          topName:
            top?.extraction?.name ??
            top?.sourceFilename.replace(/\.[^.]+$/, "") ??
            "Top candidate",
          topScore: top?.evaluation?.overallMatchScore ?? null,
        });
        setStep("done");
        setProgressLabel(null);
      } catch (err) {
        setStep("idle");
        setProgressLabel(null);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while preparing this screening. Please try again.",
        );
      }
    });
  }

  const busy = pending && step !== "done";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          New screening
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
          AI Recruiter Copilot
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Paste the job description, upload resumes, and get ranked interview
          recommendations with structured scoring.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Screening title (optional)
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none ring-brand/30 focus:ring-4"
            placeholder="Senior Frontend Engineer — March cohort"
            disabled={busy}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            rows={10}
            className="w-full rounded-xl border border-border px-3.5 py-3 text-sm leading-6 outline-none ring-brand/30 focus:ring-4"
            placeholder="Paste the full job description here…"
            disabled={busy}
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Upload resumes</h2>
            <p className="text-xs text-muted">PDF or DOCX · multiple files supported</p>
          </div>
          <p className="text-sm font-medium text-slate-700">
            {files.length} selected
          </p>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-brand hover:bg-brand-soft/40">
          <span className="text-sm font-medium text-slate-700">
            Drop files here or click to browse
          </span>
          <span className="mt-1 text-xs text-muted">
            Tip: upload a shortlist cohort together for faster comparison
          </span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => onFilesSelected(event.target.files)}
          />
        </label>
        {fileNames.length ? (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-600">
            {fileNames.map((name) => (
              <li key={name}>• {name}</li>
            ))}
          </ul>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {busy && progressLabel ? (
        <div className="space-y-2 rounded-xl border border-brand/20 bg-brand-soft/50 px-3 py-3 text-sm text-brand-strong">
          <p className="font-medium">{progressLabel}</p>
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{
                width:
                  step === "creating"
                    ? "25%"
                    : step === "uploading"
                      ? "55%"
                      : "85%",
              }}
            />
          </div>
          <p className="text-xs">
            {step === "creating" && "Step 1 of 3 · Session setup"}
            {step === "uploading" && `Step 2 of 3 · ${files.length} files`}
            {step === "screening" && "Step 3 of 3 · Ranking candidates"}
          </p>
        </div>
      ) : null}

      {summary ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700 uppercase">
            Screening complete
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Ready for recruiter review
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>
              Candidates processed:{" "}
              <span className="font-semibold">{summary.candidateCount}</span>
            </li>
            <li>
              Processing duration:{" "}
              <span className="font-semibold">{summary.durationSeconds}s</span>
            </li>
            <li>
              Highest ranked:{" "}
              <span className="font-semibold">
                {summary.topName}
                {summary.topScore != null ? ` (${summary.topScore}/100)` : ""}
              </span>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/screenings/${summary.sessionId}`);
                router.refresh();
              }}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              View ranked candidates
            </button>
            <button
              type="button"
              onClick={() => {
                setSummary(null);
                setStep("idle");
                setFiles([]);
              }}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Start another
            </button>
          </div>
        </section>
      ) : null}

      {!summary ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runWorkflow}
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Running…" : "Run AI screening"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Cancel
          </Link>
        </div>
      ) : null}
    </div>
  );
}
