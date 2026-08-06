"use client";

import { signOut } from "@/src/application/use-cases/sign-out";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
      >
        Log out
      </button>
    </form>
  );
}
