import { LoginForm } from "@/src/presentation/components/login-form";
import { DEMO_MODE_ENABLED } from "@/src/infrastructure/auth/demo-auth";
import { hasSupabaseEnv } from "@/src/infrastructure/auth/env";

type LoginPageProps = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") &&
    !params.next.includes("\\") ? params.next : "/dashboard";
  const privateAuth = hasSupabaseEnv();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white/90 p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">
          AI Resume Screener
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-slate-900">
          Explore the recruiter workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Review synthetic resumes, compare job-fit evidence and generate interview preparation reports.
          Human reviewers make all hiring decisions.
        </p>
        <div className="mt-6">
          <LoginForm nextPath={nextPath} demoMode={DEMO_MODE_ENABLED} privateAuth={privateAuth} />
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          {DEMO_MODE_ENABLED
            ? "Portfolio demo uses isolated synthetic candidates and deterministic scoring. Personal uploads are disabled."
            : privateAuth
              ? "Private account sign-in is enabled."
              : "Demo and private sign-in are not configured."}
        </div>
      </div>
    </div>
  );
}
