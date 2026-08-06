import Link from "next/link";

import { getCurrentUser } from "@/src/application/use-cases/get-current-user";

const cards = [
  {
    href: "/upload",
    title: "Upload resumes",
    copy: "Multi-file upload and job description intake (next milestone).",
  },
  {
    href: "/candidates",
    title: "Review candidates",
    copy: "Ranked candidate list and detail views will land here.",
  },
  {
    href: "/reports",
    title: "Export reports",
    copy: "Downloadable screening reports will be available later.",
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          Dashboard
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-slate-900 md:text-4xl">
          Welcome back, {user?.fullName.split(" ")[0] ?? "recruiter"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          This MVP bootstraps auth, protected routes, and navigation. Screening
          workflows are intentionally stubbed for now.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border bg-white p-5 transition hover:border-brand hover:shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{card.copy}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-brand-soft/60 p-5">
        <h2 className="text-sm font-semibold text-brand-strong">Milestone status</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>✓ Next.js App Router + TypeScript + Tailwind</li>
          <li>✓ ESLint + Prettier</li>
          <li>✓ Supabase client + demo auth</li>
          <li>✓ Protected dashboard shell</li>
          <li>○ Resume analysis (later milestone)</li>
        </ul>
      </section>
    </div>
  );
}
