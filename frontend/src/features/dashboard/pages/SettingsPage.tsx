export default function SettingsPage() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
      <h1 className="mt-2 text-2xl font-semibold">Application settings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Configure account preferences, system behavior, and future app controls here.
      </p>
    </div>
  )
}
