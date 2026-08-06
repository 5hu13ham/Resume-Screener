"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { readApiErrorMessage } from "@/src/presentation/lib/friendly-errors";

export function InstantDemoActions() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runDemo() {
    setError(null);
    setStatus("Preparing Demo Screening with sample Java resumes…");
    startTransition(async () => {
      try {
        setStatus("Running the production screening pipeline…");
        const response = await fetch("/api/demo/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = (await response.json()) as {
          session?: { id: string };
          error?: string;
          reusedExisting?: boolean;
        };
        if (!response.ok || !json.session) {
          throw new Error(
            readApiErrorMessage(
              json,
              "We couldn't start the demo right now. Please try again.",
            ),
          );
        }
        setStatus(
          json.reusedExisting
            ? "Loading existing demo ranking…"
            : "Ranking complete. Opening results…",
        );
        router.push(`/screenings/${json.session.id}`);
        router.refresh();
      } catch (err) {
        setStatus(null);
        setError(
          err instanceof Error
            ? err.message
            : "We couldn't start the demo right now. Please try again.",
        );
      }
    });
  }

  function resetDemo() {
    setError(null);
    setStatus("Removing demo sessions only…");
    startTransition(async () => {
      try {
        const response = await fetch("/api/demo/reset", { method: "POST" });
        const json = (await response.json()) as {
          deletedSessionCount?: number;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            readApiErrorMessage(
              json,
              "We couldn't reset the demo. Please try again.",
            ),
          );
        }
        setStatus(
          `Removed ${json.deletedSessionCount ?? 0} demo session(s). Your real screenings are untouched.`,
        );
        router.refresh();
      } catch (err) {
        setStatus(null);
        setError(
          err instanceof Error
            ? err.message
            : "We couldn't reset the demo. Please try again.",
        );
      }
    });
  }

  return (
    <section className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand-soft/70 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            Instant demo
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Experience the full product in under a minute
          </h2>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Loads a Java Backend Engineer JD plus 9 sample resumes, then runs the same
            screening pipeline used in production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runDemo}
            disabled={pending}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Working…" : "Try Demo"}
          </button>
          <button
            type="button"
            onClick={resetDemo}
            disabled={pending}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-70"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {status ? (
        <p className="mt-4 rounded-xl border border-brand/20 bg-white/80 px-3 py-2 text-sm text-brand-strong">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
