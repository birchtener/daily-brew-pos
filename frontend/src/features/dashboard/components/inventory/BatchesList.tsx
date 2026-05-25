import React from 'react';
import { Boxes, AlertCircle, AlertTriangle, Calendar as CalendarIcon, Package, MoreHorizontal, Trash2 } from 'lucide-react';
import { Batch } from '@/api/batches';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

type Props = {
  batchesLoading: boolean;
  batches: Batch[];
  filteredBatches: Batch[];
  batchesError: string | null;
  isAdmin: boolean;
  onFetch: () => void;
  getBatchRowClass: (b: Batch) => string;
  isBatchUnused: (b: Batch) => boolean;
  onDelete: (b: Batch) => void;
};

export default function BatchesList({
  batchesLoading,
  batches,
  filteredBatches,
  batchesError,
  isAdmin,
  onFetch,
  getBatchRowClass,
  isBatchUnused,
  onDelete,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  return (
    <>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground select-none px-1">
        <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-500/30 border border-rose-500/40" /> Expired</div>
        <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-500/30 border border-amber-500/40" /> Expires within 7 days</div>
        <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted border border-border opacity-50" /> Fully depleted</div>
      </div>

      {/* Batches Table (Desktop) */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden select-text">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground select-none">
                <th className="p-4 w-45">Ingredient</th>
                <th className="p-4 w-40">Supplier</th>
                <th className="p-4 w-27.5">Qty Received</th>
                <th className="p-4 w-30">Qty Remaining</th>
                <th className="p-4 w-25">Cost/Unit</th>
                <th className="p-4 w-27.5">Expiry</th>
                <th className="p-4 w-27.5 hidden lg:table-cell">Received</th>
                {isAdmin && <th className="p-4 w-15 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batchesLoading && batches.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-muted rounded w-20" /></td>
                    {isAdmin && <td className="p-4 text-center"><div className="size-6 bg-muted rounded mx-auto" /></td>}
                  </tr>
                ))
              ) : batchesError ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-8 animate-bounce" />
                      <p className="font-semibold">Failed to load stock batches</p>
                      <p className="text-xs text-muted-foreground max-w-sm">{batchesError}</p>
                      <Button variant="outline" size="sm" onClick={onFetch} className="mt-2">Try Again</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Boxes className="size-10 text-muted-foreground/30" />
                      <div>
                        <p className="font-medium text-foreground">No stock batches found</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">{batches.length === 0 ? 'Receive your first stock delivery to get started.' : 'Try adjusting your search or filter.'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const expiryDate = new Date(batch.expiry);
                  const receivedDate = new Date(batch.received_at);
                  const isDepleted = Number(batch.quantity_remaining) === 0;
                  return (
                    <tr key={batch.id} className={`hover:bg-muted/40 transition-colors select-none cursor-context-menu ${getBatchRowClass(batch)}`}>
                      <td className={`p-4 font-semibold text-card-foreground ${isDepleted ? 'line-through' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none"><Package className="size-4" /></div>
                          <span className="truncate">{batch.ingredient.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs font-medium">{batch.supplier_order.supplier.name}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{Number(batch.quantity_received).toFixed(1)} {batch.ingredient.unit}</td>
                      <td className="p-4 font-mono text-xs font-semibold">{Number(batch.quantity_remaining).toFixed(1)} {batch.ingredient.unit}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">₱{Number(batch.cost_per_unit).toFixed(2)}</td>
                      <td className="p-4 text-xs font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {(() => { const exp = new Date(batch.expiry); exp.setHours(0,0,0,0); if (exp < today) return <AlertTriangle className="size-3.5 text-rose-500" />; if (exp <= in7Days) return <AlertTriangle className="size-3.5 text-amber-500" />; return <CalendarIcon className="size-3.5 text-foreground" /> })()}
                          {expiryDate.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-xs font-mono text-muted-foreground whitespace-nowrap">{receivedDate.toLocaleDateString()}</td>
                      {isAdmin && (
                        <td className="p-4 text-center select-none">
                          {isBatchUnused(batch) ? (
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 hover:bg-muted/80 action-btn-trigger"><MoreHorizontal className="size-4.5" /></Button>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                                <ContextMenuItem onSelect={() => onDelete(batch)} className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer">
                                  <Trash2 className="size-3.5" /> Delete Batch
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 select-none">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batches Mobile Stacked View */}
      <div className="md:hidden flex flex-col gap-3">
        {batchesLoading && batches.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 flex flex-col gap-2"><div className="h-4 bg-muted rounded w-28" /><div className="h-3.5 bg-muted rounded w-20" /></div>
          ))
        ) : batchesError ? (
          <div className="p-6 text-center text-rose-500 border border-border bg-card rounded-xl">{batchesError}</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-border bg-card rounded-xl">No stock batches found.</div>
        ) : (
          filteredBatches.map((batch) => {
            const expiryDate = new Date(batch.expiry);
            const isDepleted = Number(batch.quantity_remaining) === 0;
            return (
              <div key={batch.id} className={`rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-context-menu ${getBatchRowClass(batch)}`}>
                <div className="min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-card-foreground text-sm truncate ${isDepleted ? 'line-through opacity-60' : ''}`}>{batch.ingredient.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono font-medium bg-muted px-1.5 py-0.5 rounded">{batch.ingredient.unit}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">From: <span className="font-semibold text-foreground">{batch.supplier_order.supplier.name}</span></p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">{(() => { const exp = new Date(batch.expiry); exp.setHours(0,0,0,0); if (exp < today) return <AlertTriangle className="size-3 text-rose-500 shrink-0" />; if (exp <= in7Days) return <AlertTriangle className="size-3 text-amber-500 shrink-0" />; return <CalendarIcon className="size-3 text-muted-foreground shrink-0" /> })()} Exp: {expiryDate.toLocaleDateString()}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right"><p className="text-xs font-mono font-bold text-foreground">{Number(batch.quantity_remaining).toFixed(1)} remaining</p><p className="text-[10px] text-muted-foreground font-mono">Recv: {Number(batch.quantity_received).toFixed(1)} · ₱{Number(batch.cost_per_unit).toFixed(2)}/u</p></div>
                  {isAdmin && isBatchUnused(batch) && (
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 hover:bg-muted/85 action-btn-trigger shrink-0"><MoreHorizontal className="size-4" /></Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                        <ContextMenuItem onSelect={() => onDelete(batch)} className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"><Trash2 className="size-3.5" /> Delete Batch</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
