"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { readApiErrorMessage } from "@/src/presentation/lib/friendly-errors";

type SessionActionsProps = {
  sessionId: string;
  title: string;
};

export function SessionActions({ sessionId, title }: SessionActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveTitle() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draft }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(
            readApiErrorMessage(json, "We couldn't rename this screening."),
          );
        }
        setEditing(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Rename failed.");
      }
    });
  }

  function deleteSession() {
    const confirmed = window.confirm(
      `Delete “${title}”? This removes the screening, candidates, and uploaded files. This cannot be undone.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "DELETE",
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(
            readApiErrorMessage(json, "We couldn't delete this screening."),
          );
        }
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-[220px] flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none ring-brand/30 focus:ring-4"
            disabled={pending}
          />
          <button
            type="button"
            onClick={saveTitle}
            disabled={pending}
            className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-70"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setEditing(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-70"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={deleteSession}
            disabled={pending}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-70"
          >
            Delete
          </button>
        </div>
      )}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
