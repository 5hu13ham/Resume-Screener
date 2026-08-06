"use client";

import { useActionState } from "react";

import { signIn, type SignInState } from "@/src/application/use-cases/sign-in";
import { DEMO_CREDENTIALS } from "@/src/infrastructure/auth/demo-auth";

const initialState: SignInState = {};

type LoginFormProps = {
  nextPath: string;
  demoMode: boolean;
};

export function LoginForm({ nextPath, demoMode }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={demoMode ? DEMO_CREDENTIALS.email : ""}
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none ring-brand/30 transition focus:ring-4"
          placeholder="you@company.com"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue={demoMode ? DEMO_CREDENTIALS.password : ""}
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none ring-brand/30 transition focus:ring-4"
          placeholder="••••••••"
        />
      </label>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
