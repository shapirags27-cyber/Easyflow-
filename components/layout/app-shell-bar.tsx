export function AppShellBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
