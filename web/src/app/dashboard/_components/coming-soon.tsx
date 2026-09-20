export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-panel flex min-h-[320px] flex-col items-center justify-center rounded-2xl p-6 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      <span className="mt-4 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
        Coming soon
      </span>
    </div>
  );
}
