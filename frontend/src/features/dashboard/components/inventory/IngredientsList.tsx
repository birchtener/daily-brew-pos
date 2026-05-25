import { Package, AlertCircle, TrendingDown, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import type { Ingredient } from '@/api/ingredients';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

import { StockBadge } from '@/features/dashboard/pages/InventoryPage';

type Props = {
  ingredientsLoading: boolean;
  ingredients: Ingredient[];
  filteredIngredients: Ingredient[];
  ingredientsError: string | null;
  isAdmin: boolean;
  onFetch: () => void;
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
};

export default function IngredientsList({
  ingredientsLoading,
  ingredients,
  filteredIngredients,
  ingredientsError,
  isAdmin,
  onFetch,
  onEdit,
  onDelete,
}: Props) {
  return (
    <>
      {/* Ingredients Table (Desktop) */}
      <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden select-text">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground select-none">
                <th className="p-4 w-55 md:w-70">Ingredient Name</th>
                <th className="p-4 w-25">Unit</th>
                <th className="p-4 w-35">Alert Threshold</th>
                <th className="p-4 w-32.5">Current Stock</th>
                <th className="p-4 w-22.5">Status</th>
                {isAdmin && <th className="p-4 w-15 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ingredientsLoading && ingredients.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="flex items-center gap-3"><div className="size-8 rounded-lg bg-muted shrink-0" /><div className="h-4 bg-muted rounded w-36" /></div></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-12" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="p-4"><div className="h-5 bg-muted rounded-full w-12" /></td>
                    {isAdmin && <td className="p-4 text-center"><div className="size-6 bg-muted rounded mx-auto" /></td>}
                  </tr>
                ))
              ) : ingredientsError ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-8 animate-bounce" />
                      <p className="font-semibold">Failed to load ingredients</p>
                      <p className="text-xs text-muted-foreground max-w-sm">{ingredientsError}</p>
                      <Button variant="outline" size="sm" onClick={onFetch} className="mt-2">Try Again</Button>
                    </div>
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="size-10 text-muted-foreground/30" />
                      <div>
                        <p className="font-medium text-foreground">No ingredients found</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                          {ingredients.length === 0 ? 'Add your first ingredient to get started.' : 'Try adjusting your search terms.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((ing) => (
                  <tr
                    key={ing.id}
                    className="hover:bg-muted/40 transition-colors select-none cursor-context-menu"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const btn = e.currentTarget.querySelector('.action-btn-trigger');
                      if (btn) {
                        const event = new MouseEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          clientX: e.clientX,
                          clientY: e.clientY,
                        });
                        btn.dispatchEvent(event);
                      }
                    }}
                  >
                    <td className="p-4 font-semibold text-card-foreground">
                      <div className="flex items-center gap-3 min-w-0">
                        {ing.img_path ? (
                          <img src={ing.img_path} alt={ing.name} className="size-8 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                            <Package className="size-4" />
                          </div>
                        )}
                        <span className="truncate">{ing.name}</span>
                      </div>
                    </td>

                    <td className="p-4 text-muted-foreground">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">{ing.unit}</span>
                    </td>

                    <td className="p-4 text-muted-foreground font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="size-3.5 text-muted-foreground/70" />
                        {Number(ing.low_stock_threshold).toFixed(1)} {ing.unit}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-sm font-semibold">{ing.current_stock.toFixed(1)} {ing.unit}</td>

                    <td className="p-4">
                      <StockBadge currentStock={ing.current_stock} threshold={Number(ing.low_stock_threshold)} />
                    </td>

                    {isAdmin && (
                      <td className="p-4 text-center select-none">
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <Button 
                              variant="ghost" size="icon" 
                              className="size-8 hover:bg-muted/80 action-btn-trigger"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const event = new MouseEvent('contextmenu', {
                                  bubbles: true,
                                  cancelable: true,
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                });
                                e.currentTarget.dispatchEvent(event);
                              }}
                            >
                              <MoreHorizontal className="size-4.5" />
                            </Button>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                            <ContextMenuItem onSelect={() => onEdit(ing)} className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer">
                              <Edit3 className="size-3.5 text-muted-foreground" /> Edit Ingredient
                            </ContextMenuItem>
                            <ContextMenuItem onSelect={() => onDelete(ing)} className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer">
                              <Trash2 className="size-3.5" /> Delete Ingredient
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingredients Mobile Stacked View */}
      <div className="md:hidden flex flex-col gap-3">
        {ingredientsLoading && ingredients.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 bg-muted rounded w-24" />
                  <div className="h-2.5 bg-muted rounded w-12" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))
        ) : ingredientsError ? (
          <div className="p-6 text-center text-rose-500 border border-border bg-card rounded-xl">{ingredientsError}</div>
        ) : filteredIngredients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-border bg-card rounded-xl">No ingredients found.</div>
        ) : (
          filteredIngredients.map((ing) => (
            <div
              key={ing.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-context-menu"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.currentTarget.querySelector('.action-btn-trigger');
                if (btn) {
                  const event = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  });
                  btn.dispatchEvent(event);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {ing.img_path ? (
                  <img src={ing.img_path} alt={ing.name} className="size-10 rounded-lg object-cover border border-border shrink-0" />
                ) : (
                  <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                    <Package className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex flex-col gap-1">
                  <span className="font-semibold text-card-foreground truncate text-sm">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground uppercase">{ing.unit}</span>
                    <StockBadge currentStock={ing.current_stock} threshold={Number(ing.low_stock_threshold)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-foreground">{ing.current_stock.toFixed(1)} {ing.unit}</p>
                  <p className="text-[10px] text-muted-foreground">Min: {Number(ing.low_stock_threshold).toFixed(1)}</p>
                </div>
                {isAdmin && (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:bg-muted/85 action-btn-trigger shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const event = new MouseEvent('contextmenu', {
                            bubbles: true,
                            cancelable: true,
                            clientX: e.clientX,
                            clientY: e.clientY,
                          });
                          e.currentTarget.dispatchEvent(event);
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                      <ContextMenuItem onSelect={() => onEdit(ing)} className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer">
                        <Edit3 className="size-3.5 text-muted-foreground" /> Edit Ingredient
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => onDelete(ing)} className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer">
                        <Trash2 className="size-3.5" /> Delete Ingredient
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
