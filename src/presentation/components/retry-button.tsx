"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RetryButtonProps = {
  candidateId: string;
};

export function RetryButton({ candidateId }: RetryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRetry() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/candidates/${candidateId}/retry`, {
        method: "POST",
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Retry failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:opacity-70"
      >
        {loading ? "Retrying AI…" : "Retry AI evaluation"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
