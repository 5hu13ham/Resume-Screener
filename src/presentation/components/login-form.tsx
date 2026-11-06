"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, type SignInState } from "@/src/application/use-cases/sign-in";

const initialState: SignInState = {};

type LoginFormProps = { nextPath: string; demoMode: boolean; privateAuth: boolean };

export function LoginForm({ nextPath, demoMode, privateAuth }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [demoError, setDemoError] = useState("");
  const [starting, setStarting] = useState(false);

  async function startDemo() {
    setStarting(true);
    setDemoError("");
    try {
      const response = await fetch("/api/demo/session", { method: "POST" });
      if (!response.ok) throw new Error("Demo is temporarily unavailable.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Couldn't start demo.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="space-y-5">
      {demoMode && (
        <div className="space-y-2">
          <button type="button" onClick={startDemo} disabled={starting}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
            {starting ? "Preparing your sandbox…" : "Explore synthetic-data demo"}
          </button>
          <p className="text-xs leading-5 text-slate-500">
            No personal resumes needed. Each browser receives an isolated, expiring demo session.
          </p>
          {demoError && <p role="alert" className="text-sm text-red-700">{demoError}</p>}
        </div>
      )}

      {privateAuth && (
        <form action={formAction} className="space-y-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Private account</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input name="email" type="email" required autoComplete="email"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm" />
          </label>
          <input type="hidden" name="next" value={nextPath} />
          {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-xl border border-brand px-4 py-2.5 font-semibold text-brand disabled:opacity-60">
            {pending ? "Signing in…" : "Sign in privately"}
          </button>
        </form>
      )}
    </div>
  );
}
