import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({
  title,
  description,
  primaryHref = "/upload",
  primaryLabel = "Create a screening",
  secondaryHref = "/dashboard",
  secondaryLabel = "Try Demo on Dashboard",
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={primaryHref}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
