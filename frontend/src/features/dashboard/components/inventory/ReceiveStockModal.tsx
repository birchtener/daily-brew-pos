import React from 'react';
import { X, Plus, LoaderCircle, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Ingredient } from '@/api/ingredients';
import { Supplier } from '@/api/suppliers';
import { FeedbackState } from '@/features/dashboard/pages/InventoryPage';

type LineItem = {
  _key: number;
  ingredient_id: string;
  quantity_received: number;
  cost_per_unit: number;
  expiry: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  ingredients: Ingredient[];
  receiveSupplier: string;
  setReceiveSupplier: (v: string) => void;
  receiveItems: LineItem[];
  addReceiveItem: () => void;
  removeReceiveItem: (key: number) => void;
  updateReceiveItem: (key: number, field: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  feedback: FeedbackState | null;
};

export default function ReceiveStockModal({
  isOpen,
  onClose,
  suppliers,
  ingredients,
  receiveSupplier,
  setReceiveSupplier,
  receiveItems,
  addReceiveItem,
  removeReceiveItem,
  updateReceiveItem,
  onSubmit,
  submitting,
  feedback,
}: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" /> Receive Stock Delivery
          </h2>
          <button onClick={onClose} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">Supplier <span className="text-rose-500">*</span></label>
            <Select value={receiveSupplier} onValueChange={setReceiveSupplier}>
              <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-sm font-medium text-foreground">
                <SelectValue placeholder="Select a supplier…" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-card-foreground">Delivery Line Items</label>
              <Button type="button" variant="outline" size="sm" onClick={addReceiveItem} className="h-7 px-3 text-[11px] font-medium gap-1">
                <Plus className="size-3" /> Add Item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {receiveItems.map((item, index) => (
                <div key={item._key} className="rounded-lg border border-border bg-muted/30 p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item #{index + 1}</span>
                    {receiveItems.length > 1 && (
                      <button type="button" onClick={() => removeReceiveItem(item._key)} className="size-6 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-rose-500 transition">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground">Ingredient <span className="text-rose-500">*</span></label>
                      <Select value={item.ingredient_id} onValueChange={(val) => updateReceiveItem(item._key, 'ingredient_id', val)}>
                        <SelectTrigger className="h-9 w-full bg-background border border-border shadow-none text-xs">
                          <SelectValue placeholder="Select ingredient…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Quantity <span className="text-rose-500">*</span></label>
                      <Input type="number" step="0.001" min="0.001" value={item.quantity_received || ''} onChange={(e) => updateReceiveItem(item._key, 'quantity_received', parseFloat(e.target.value) || 0)} placeholder="0.000" className="h-9 text-xs font-mono" required />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Cost per Unit (₱)</label>
                      <Input type="number" step="0.01" min="0" value={item.cost_per_unit || ''} onChange={(e) => updateReceiveItem(item._key, 'cost_per_unit', parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-9 text-xs font-mono" />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-muted-foreground">Expiry Date <span className="text-rose-500">*</span></label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("h-9 w-full justify-start text-left text-xs font-mono font-normal shadow-none border border-border bg-background hover:bg-muted/40", !item.expiry && "text-muted-foreground")}>
                            {item.expiry ? format(new Date(item.expiry), 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-100 bg-card border border-border rounded-lg shadow-md" align="start">
                          <Calendar mode="single" selected={item.expiry ? new Date(item.expiry) : undefined} onSelect={(date) => {
                            if (date) {
                              const yyyy = date.getFullYear();
                              const mm = String(date.getMonth() + 1).padStart(2, '0');
                              const dd = String(date.getDate()).padStart(2, '0');
                              updateReceiveItem(item._key, 'expiry', `${yyyy}-${mm}-${dd}`);
                            }
                          }} captionLayout="dropdown" startMonth={new Date(new Date().getFullYear() - 5, 0)} endMonth={new Date(new Date().getFullYear() + 10, 11)} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {feedback && <div>{feedback.message}</div>}

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
            <Button type="submit" disabled={submitting} className="h-9 px-4 text-xs font-semibold">
              {submitting ? (
                <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Processing…</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><PackagePlus className="size-3.5" /> Receive {receiveItems.length} Item{receiveItems.length > 1 ? 's' : ''}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
