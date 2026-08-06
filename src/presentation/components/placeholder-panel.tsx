type PlaceholderPanelProps = {
  title: string;
  description: string;
};

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 shadow-sm">
      <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
        Coming soon
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-slate-900">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </section>
  );
}
