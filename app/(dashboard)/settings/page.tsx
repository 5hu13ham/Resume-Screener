import { getLlmRuntimeConfig } from "@/src/infrastructure/llm/llm-config";

export default function SettingsPage() {
  const llm = getLlmRuntimeConfig();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900">
          Workspace configuration
        </h1>
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-white p-5 text-sm">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            AI Provider
          </p>
          <p className="mt-1 font-medium text-slate-900">{llm.provider}</p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Configured Model
          </p>
          <p className="mt-1 font-medium text-slate-900">{llm.model}</p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Configured Base URL
          </p>
          <p className="mt-1 break-all font-medium text-slate-900">{llm.baseUrl}</p>
        </div>

        <div className="rounded-xl border border-border bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            LLM Status
          </p>
          {llm.status === "live" ? (
            <div className="mt-2 space-y-1">
              <p className="font-semibold text-emerald-700">🟢 Live Gemini</p>
              <p className="text-xs text-muted">
                Requests use the OpenAI-compatible Gemini endpoint. API keys are never
                displayed here.
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="font-semibold text-amber-700">🟡 Heuristic Fallback</p>
              <p className="text-xs text-muted">
                Reason: {llm.statusReason ?? "OPENAI_API_KEY not configured"}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-700">Demo auth mode</span>
          <span className="font-medium text-slate-900">
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? "Enabled" : "Disabled"}
          </span>
        </div>
      </section>
    </div>
  );
}
