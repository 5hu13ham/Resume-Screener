"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type UploadedCandidate = {
  id: string;
  sourceFilename: string;
};

export function ScreeningWizard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "creating" | "uploading" | "screening">(
    "idle",
  );
  const [pending, startTransition] = useTransition();

  const fileNames = useMemo(() => {
    if (!files) return [];
    return Array.from(files).map((file) => file.name);
  }, [files]);

  async function runWorkflow() {
    setError(null);

    if (jobDescription.trim().length < 40) {
      setError("Paste a fuller job description (at least ~40 characters).");
      return;
    }
    if (!files?.length) {
      setError("Select one or more PDF/DOCX resumes.");
      return;
    }

    startTransition(async () => {
      try {
        setStep("creating");
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
          throw new Error(sessionJson.error ?? "Failed to create screening.");
        }

        setStep("uploading");
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));
        const uploadRes = await fetch(
          `/api/sessions/${sessionJson.session.id}/uploads`,
          { method: "POST", body: formData },
        );
        const uploadJson = (await uploadRes.json()) as {
          candidates?: UploadedCandidate[];
          error?: string;
        };
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error ?? "Upload failed.");
        }

        setStep("screening");
        const screenRes = await fetch(
          `/api/sessions/${sessionJson.session.id}/screen`,
          { method: "POST" },
        );
        const screenJson = (await screenRes.json()) as { error?: string };
        if (!screenRes.ok) {
          throw new Error(screenJson.error ?? "AI screening failed.");
        }

        router.push(`/screenings/${sessionJson.session.id}`);
        router.refresh();
      } catch (err) {
        setStep("idle");
        setError(err instanceof Error ? err.message : "Unexpected error.");
      }
    });
  }

  const busy = pending || step !== "idle";

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
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Upload resumes</h2>
          <p className="text-xs text-muted">PDF or DOCX · multiple files supported</p>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-brand hover:bg-brand-soft/40">
          <span className="text-sm font-medium text-slate-700">
            Drop files here or click to browse
          </span>
          <span className="mt-1 text-xs text-muted">Max size controlled by MAX_UPLOAD_BYTES</span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => setFiles(event.target.files)}
          />
        </label>
        {fileNames.length ? (
          <ul className="space-y-1 text-sm text-slate-600">
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

      {busy ? (
        <p className="rounded-xl border border-brand/20 bg-brand-soft/50 px-3 py-2 text-sm text-brand-strong">
          {step === "creating" && "Creating screening session…"}
          {step === "uploading" && "Uploading and storing resumes…"}
          {step === "screening" &&
            "Parsing resumes and running AI evaluation. This can take a moment…"}
        </p>
      ) : null}

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
    </div>
  );
}
