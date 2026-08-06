import { LoginForm } from "@/src/presentation/components/login-form";
import { DEMO_MODE_ENABLED } from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white/90 p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
          AI Resume Screener
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Access your screening dashboard. Resume analysis arrives in a later milestone.
        </p>

        <div className="mt-6">
          <LoginForm nextPath={nextPath} demoMode={DEMO_MODE_ENABLED} />
        </div>

        <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          {DEMO_MODE_ENABLED ? (
            <p>
              Demo mode is on. Use{" "}
              <span className="font-semibold">demo@resumescreener.local</span> /{" "}
              <span className="font-semibold">demo1234</span>.
            </p>
          ) : null}
          <p>
            Supabase:{" "}
            {hasSupabaseEnv()
              ? "configured — email/password login enabled."
              : "not configured — set env vars to enable cloud auth."}
          </p>
        </div>
      </div>
    </div>
  );
}
