import React, { useEffect, useState } from 'react';
import { X, LoaderCircle, AlertTriangle, Scale, ClipboardEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Ingredient } from '@/api/ingredients';
import { getBatches, type Batch } from '@/api/batches';
import { createAdjustment, type CreateAdjustmentPayload, type AdjustmentReason } from '@/api/adjustments';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { toast } from 'sonner';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSuccess: () => void;
  preSelectedIngredientId?: string;
  preSelectedBatchId?: string;
};

const REASON_OPTIONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'spill', label: 'Spillage / Accident' },
  { value: 'expired', label: 'Expiration' },
  { value: 'waste', label: 'Wastage / Bad Prep' },
  { value: 'theft', label: 'Unexplained Theft / Loss' },
  { value: 'correction', label: 'Stock-take Correction' },
];

export default function AdjustStockModal({
  isOpen,
  onClose,
  ingredients,
  onSuccess,
  preSelectedIngredientId,
  preSelectedBatchId,
}: Props) {
  const [ingredientId, setIngredientId] = useState('');
  const [useSpecificBatch, setUseSpecificBatch] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<AdjustmentReason>('spill');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Initialize/reset form state on open
  useEffect(() => {
    if (isOpen) {
      setIngredientId(preSelectedIngredientId || '');
      setUseSpecificBatch(!!preSelectedBatchId);
      setBatchId(preSelectedBatchId || '');
      setQuantity('');
      setReason(preSelectedBatchId ? 'expired' : 'spill');
      setNotes('');
    }
  }, [isOpen, preSelectedIngredientId, preSelectedBatchId]);

  // Fetch batches when ingredient changes
  useEffect(() => {
    if (!ingredientId) {
      setBatches([]);
      return;
    }
    const fetchIngredientBatches = async () => {
      setBatchesLoading(true);
      try {
        const active = await getBatches(ingredientId);
        // Filter out fully depleted batches, but always retain the preSelectedBatchId if it matches
        const filtered = active.filter(
          (b) => Number(b.quantity_remaining) > 0 || b.id === preSelectedBatchId
        );
        setBatches(filtered);
      } catch (err) {
        console.error('Failed to fetch batches in AdjustStockModal:', err);
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchIngredientBatches();
  }, [ingredientId, preSelectedBatchId]);

  if (!isOpen) return null;

  const selectedIngredient = ingredients.find((ing) => ing.id === ingredientId);
  const selectedUnit = selectedIngredient ? selectedIngredient.unit : '';

  // Calculate available remaining stock based on toggle
  const selectedBatch = batches.find((b) => b.id === batchId);
  const availableStock = useSpecificBatch
    ? selectedBatch
      ? Number(selectedBatch.quantity_remaining)
      : 0
    : batches.reduce((sum, b) => sum + Number(b.quantity_remaining), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientId) {
      toast.error('Please select an ingredient.');
      return;
    }
    if (useSpecificBatch && !batchId) {
      toast.error('Please select a specific batch.');
      return;
    }
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.error('Adjustment quantity must be greater than zero.');
      return;
    }
    if (parsedQty > availableStock) {
      toast.error(`Cannot adjust more than available stock (${availableStock.toFixed(2)} ${selectedUnit}).`);
      return;
    }

    setSubmitting(true);

    const payload: CreateAdjustmentPayload = {
      ingredient_id: ingredientId,
      quantity: parsedQty,
      reason,
      notes: notes.trim() || undefined,
      ...(useSpecificBatch ? { batch_id: batchId } : {}),
    };

    try {
      await createAdjustment(payload);
      toast.success('Stock reduced successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to process manual stock reduction.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardEdit className="size-5 text-primary animate-pulse" /> Manual Stock Reduction
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Ingredient Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">
              Ingredient <span className="text-destructive">*</span>
            </label>
            <Select
              value={ingredientId}
              onValueChange={(val) => {
                setIngredientId(val);
                setBatchId('');
              }}
              disabled={!!preSelectedIngredientId}
            >
              <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-sm font-medium text-foreground">
                <SelectValue placeholder="Select ingredient to reduce…" />
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

          {ingredientId && (
            <>
              {/* Batch-Specific Reduction Switch */}
              <div className="flex items-center justify-between py-1 bg-muted/20 px-2 rounded-lg border border-border/40">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useSpecificBatch}
                    onChange={(e) => {
                      setUseSpecificBatch(e.target.checked);
                      if (!e.target.checked) setBatchId('');
                    }}
                    disabled={!!preSelectedBatchId}
                    className="rounded border-border bg-background text-primary focus:ring-primary size-4"
                  />
                  <span className="text-xs font-bold text-card-foreground">Reduce Specific Batch</span>
                </label>
                {batchesLoading && (
                  <LoaderCircle className="size-3.5 text-muted-foreground animate-spin" />
                )}
              </div>

              {/* Batch Selector (Conditional) */}
              {useSpecificBatch && (
                <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="text-xs font-semibold text-card-foreground">
                    Select Stock Batch <span className="text-destructive">*</span>
                  </label>
                  <Select value={batchId} onValueChange={setBatchId} disabled={!!preSelectedBatchId}>
                    <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-xs font-mono">
                      <SelectValue placeholder="Select batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="font-mono text-[11px]">
                          Expiry: {new Date(b.expiry).toLocaleDateString()} — Left:{' '}
                          {Number(b.quantity_remaining).toFixed(1)} {selectedUnit} [
                          {b.supplier_order.supplier.name}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Available Stock Indicator */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 text-xs">
                <Scale className="size-4 text-primary" />
                <div className="flex-1">
                  <span className="text-muted-foreground">Available Stock to Deduct:</span>{' '}
                  <span className="font-bold font-mono">
                    {availableStock.toFixed(2)} {selectedUnit}
                  </span>
                  {useSpecificBatch ? (
                    <span className="text-muted-foreground text-[10px] block">
                      (Limit of chosen batch)
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[10px] block">
                      (Cumulative total across all active batches using FIFO)
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Adjustment Quantity & Reason Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">
                Deduct Quantity <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.000"
                className="h-10 text-sm font-mono"
                disabled={!ingredientId || availableStock === 0}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">
                Reason <span className="text-destructive">*</span>
              </label>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val as AdjustmentReason)}
                disabled={!ingredientId}
              >
                <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-xs font-medium">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes Area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">Notes / Context</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milk spilled during the morning rush hour on counter..."
              className="w-full h-20 rounded-lg border border-border bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground select-text"
              maxLength={500}
              disabled={!ingredientId}
            />
          </div>

          {/* Alert Callout for Depleted Stock */}
          {ingredientId && availableStock === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Zero Stock Available</p>
                <p className="text-[10px] text-destructive/80 mt-0.5">
                  Cannot perform adjustments as this ingredient has no remaining quantities in active
                  batches.
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !ingredientId || availableStock === 0}
              className="h-9 px-4 text-xs font-semibold"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoaderCircle className="size-3.5 animate-spin" /> Deducting…
                </span>
              ) : (
                'Process Deduction'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
