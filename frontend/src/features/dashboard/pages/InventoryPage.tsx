export default function InventoryPage() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Inventory</p>
      <h1 className="mt-2 text-2xl font-semibold">Stock and ingredients</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Track ingredient balances, batches, FIFO deductions, and low-stock state.
      </p>
    </div>
  )
}
