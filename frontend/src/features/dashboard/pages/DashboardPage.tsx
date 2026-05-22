export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Inventory</p>
        <h2 className="mt-1 text-xl font-semibold">Catalog and stock modules are live</h2>
      </div>
      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Orders</p>
        <h2 className="mt-1 text-xl font-semibold">POS checkout and parked settlement are live</h2>
      </div>
      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold">Financial and stock reporting are live</h2>
      </div>
    </div>
  )
}
