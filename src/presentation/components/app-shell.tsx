import Link from "next/link";

import type { AppUser } from "@/src/application/use-cases/get-current-user";
import { LogoutButton } from "@/src/presentation/components/logout-button";
import { SidebarNav } from "@/src/presentation/components/sidebar-nav";

type AppShellProps = {
  user: AppUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <aside className="flex w-full flex-col justify-between rounded-3xl border border-border bg-white/90 p-5 shadow-sm md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-64 md:shrink-0">
        <div className="space-y-8">
          <div>
            <Link
              href="/dashboard"
              className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-brand-strong"
            >
              Resume Screener
            </Link>
            <p className="mt-1 text-sm text-muted">AI screening workspace</p>
          </div>
          <SidebarNav />
        </div>

        <div className="mt-8 space-y-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            {user.isDemo ? (
              <p className="mt-1 text-xs font-medium text-accent">Demo session</p>
            ) : null}
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 rounded-3xl border border-border bg-white/70 p-5 shadow-sm md:p-8">
        {children}
      </main>
    </div>
  );
}
