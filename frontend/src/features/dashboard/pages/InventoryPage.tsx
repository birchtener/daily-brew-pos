import { useEffect, useState, useCallback, useRef } from 'react';
import { Boxes, AlertCircle, Package, AlertTriangle, Calendar as CalendarIcon, MoreHorizontal, Trash2, Scale } from 'lucide-react';
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  type Ingredient,
  type Unit,
} from '@/api/ingredients';
import {
  getBatches,
  receiveStock,
  deleteBatch,
  type Batch,
  type ReceiveStockLineItem,
} from '@/api/batches';
import {
  getSuppliers,
  type Supplier,
} from '@/api/suppliers';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import InventoryToolbar from '@/features/dashboard/components/inventory/InventoryToolbar';
import BatchToolbar from '@/features/dashboard/components/inventory/BatchToolbar';
import AddEditIngredientModal from '@/features/dashboard/components/inventory/AddEditIngredientModal';
import ReceiveStockModal from '@/features/dashboard/components/inventory/ReceiveStockModal';
import DeleteIngredientDialog from '@/features/dashboard/components/inventory/DeleteIngredientDialog';
import DeleteBatchDialog from '@/features/dashboard/components/inventory/DeleteBatchDialog';
import IngredientsList from '@/features/dashboard/components/inventory/IngredientsList';
import BatchesList from '@/features/dashboard/components/inventory/BatchesList';
import AdjustStockModal from '@/features/dashboard/components/inventory/AdjustStockModal';

// ── Constants ──────────────────────────────────────────────────
export const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'mg', label: 'Milligram (mg)' },
  { value: 'l', label: 'Liter (l)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Box' },
  { value: 'can', label: 'Can' },
];

export type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export function StockBadge({ currentStock, threshold }: { currentStock: number; threshold: number }) {
  if (currentStock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive border border-destructive/20">
        <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
        Out
      </span>
    );
  }
  if (currentStock <= threshold) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      OK
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function InventoryPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('ingredients');

  // ── INGREDIENTS STATE ──
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientSearchDebounced, setIngredientSearchDebounced] = useState('');

  // Ingredient modals
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

  // Ingredient form
  const [ingFormName, setIngFormName] = useState('');
  const [ingFormUnit, setIngFormUnit] = useState<Unit>('kg');
  const [ingFormThreshold, setIngFormThreshold] = useState('0');
  const [ingFormImage, setIngFormImage] = useState<File | null>(null);
  const [ingFormImagePreview, setIngFormImagePreview] = useState<string | null>(null);
  const [ingSubmitting, setIngSubmitting] = useState(false);
  const [ingModalFeedback, setIngModalFeedback] = useState<FeedbackState>(null);
  const ingFileInputRef = useRef<HTMLInputElement>(null);

  // ── BATCHES STATE ──
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [batchSearch, setBatchSearch] = useState('');
  const [batchSearchDebounced, setBatchSearchDebounced] = useState('');
  const [batchIngredientFilter, setBatchIngredientFilter] = useState('');

  // Batch modals
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);

  // Receive stock form
  const [receiveSupplier, setReceiveSupplier] = useState('');
  const [receiveItems, setReceiveItems] = useState<(ReceiveStockLineItem & { _key: number })[]>([
    { _key: Date.now(), ingredient_id: '', quantity_received: 0, cost_per_unit: 0, expiry: '' },
  ]);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveModalFeedback, setReceiveModalFeedback] = useState<FeedbackState>(null);
  const [batchDeleteSubmitting, setBatchDeleteSubmitting] = useState(false);
  const [batchDeleteFeedback, setBatchDeleteFeedback] = useState<FeedbackState>(null);

  // Suppliers list (for receive stock dropdown)
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // ── ADJUSTMENT STATE ──
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustPreselectedIngredientId, setAdjustPreselectedIngredientId] = useState<string | undefined>(undefined);
  const [adjustPreselectedBatchId, setAdjustPreselectedBatchId] = useState<string | undefined>(undefined);

  const handleOpenAdjustStock = () => {
    setAdjustPreselectedIngredientId(undefined);
    setAdjustPreselectedBatchId(undefined);
    setIsAdjustStockOpen(true);
  };

  const handleOpenAdjustSpecificBatch = (batch: Batch) => {
    setAdjustPreselectedIngredientId(batch.ingredient_id);
    setAdjustPreselectedBatchId(batch.id);
    setIsAdjustStockOpen(true);
  };

  // ── SEARCH DEBOUNCE ──
  useEffect(() => {
    const h = setTimeout(() => setIngredientSearchDebounced(ingredientSearch), 400);
    return () => clearTimeout(h);
  }, [ingredientSearch]);

  useEffect(() => {
    const h = setTimeout(() => setBatchSearchDebounced(batchSearch), 400);
    return () => clearTimeout(h);
  }, [batchSearch]);

  // ── DATA FETCHING ──
  const fetchIngredients = useCallback(async () => {
    setIngredientsLoading(true);
    setIngredientsError(null);
    try {
      const data = await getIngredients();
      setIngredients(data);
    } catch (err: any) {
      setIngredientsError(err?.response?.data?.message || 'Failed to fetch ingredients.');
    } finally {
      setIngredientsLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const data = await getBatches(batchIngredientFilter || undefined);
      setBatches(data);
    } catch (err: any) {
      setBatchesError(err?.response?.data?.message || 'Failed to fetch batches.');
    } finally {
      setBatchesLoading(false);
    }
  }, [batchIngredientFilter]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchIngredients();
    fetchSuppliers();
  }, [fetchIngredients, fetchSuppliers]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // ── INGREDIENT HANDLERS ──
  const resetIngredientForm = () => {
    setIngFormName('');
    setIngFormUnit('kg');
    setIngFormThreshold('0');
    setIngFormImage(null);
    setIngFormImagePreview(null);
    setIngModalFeedback(null);
    setIngSubmitting(false);
  };

  const handleOpenAddIngredient = () => {
    resetIngredientForm();
    setIsAddIngredientOpen(true);
  };

  const handleOpenEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIngFormName(ing.name);
    setIngFormUnit(ing.unit);
    setIngFormThreshold(String(ing.low_stock_threshold));
    setIngFormImage(null);
    setIngFormImagePreview(ing.img_path || null);
    setIngModalFeedback(null);
    setIngSubmitting(false);
  };

  const handleIngImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIngFormImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setIngFormImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearIngImage = () => {
    setIngFormImage(null);
    setIngFormImagePreview(null);
    if (ingFileInputRef.current) ingFileInputRef.current.value = '';
  };

  const handleAddIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingFormName.trim()) {
      setIngModalFeedback({ type: 'error', message: 'Ingredient name is required.' });
      return;
    }
    setIngSubmitting(true);
    setIngModalFeedback(null);
    try {
      await createIngredient({
        name: ingFormName.trim(),
        unit: ingFormUnit,
        low_stock_threshold: parseFloat(ingFormThreshold) || 0,
        image: ingFormImage,
      });
      setIsAddIngredientOpen(false);
      fetchIngredients();
    } catch (err: any) {
      setIngModalFeedback({ type: 'error', message: extractErrorMessage(err, 'Failed to add ingredient.') });
    } finally {
      setIngSubmitting(false);
    }
  };

  const handleEditIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    if (!ingFormName.trim()) {
      setIngModalFeedback({ type: 'error', message: 'Ingredient name is required.' });
      return;
    }
    setIngSubmitting(true);
    setIngModalFeedback(null);
    const isImageCleared = ingFormImagePreview === null && editingIngredient.img_path !== null;
    try {
      await updateIngredient(editingIngredient.id, {
        name: ingFormName.trim(),
        unit: ingFormUnit,
        low_stock_threshold: parseFloat(ingFormThreshold) || 0,
        image: ingFormImage,
        ...(isImageCleared ? { img_path: null } : {}),
      });
      setEditingIngredient(null);
      fetchIngredients();
    } catch (err: any) {
      setIngModalFeedback({ type: 'error', message: extractErrorMessage(err, 'Failed to update ingredient.') });
    } finally {
      setIngSubmitting(false);
    }
  };

  const handleDeleteIngredientSubmit = async () => {
    if (!deletingIngredient) return;
    setIngSubmitting(true);
    setIngModalFeedback(null);
    try {
      await deleteIngredient(deletingIngredient.id);
      setDeletingIngredient(null);
      fetchIngredients();
      fetchBatches();
    } catch (err: any) {
      setIngModalFeedback({ type: 'error', message: extractErrorMessage(err, 'Failed to delete ingredient.') });
    } finally {
      setIngSubmitting(false);
    }
  };

  // ── RECEIVE STOCK HANDLERS ──
  const handleOpenReceiveStock = () => {
    setReceiveSupplier('');
    setReceiveItems([
      { _key: Date.now(), ingredient_id: '', quantity_received: 0, cost_per_unit: 0, expiry: '' },
    ]);
    setReceiveModalFeedback(null);
    setReceiveSubmitting(false);
    setIsReceiveStockOpen(true);
  };

  const addReceiveItem = () => {
    setReceiveItems((prev) => [
      ...prev,
      { _key: Date.now() + Math.random(), ingredient_id: '', quantity_received: 0, cost_per_unit: 0, expiry: '' },
    ]);
  };

  const removeReceiveItem = (key: number) => {
    setReceiveItems((prev) => prev.filter((item) => item._key !== key));
  };

  const updateReceiveItem = (key: number, field: string, value: any) => {
    setReceiveItems((prev) =>
      prev.map((item) => (item._key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveSupplier) {
      setReceiveModalFeedback({ type: 'error', message: 'Please select a supplier.' });
      return;
    }
    const validItems = receiveItems.filter((i) => i.ingredient_id && i.quantity_received > 0 && i.expiry);
    if (validItems.length === 0) {
      setReceiveModalFeedback({ type: 'error', message: 'Add at least one valid line item with ingredient, quantity, and expiry.' });
      return;
    }

    setReceiveSubmitting(true);
    setReceiveModalFeedback(null);
    try {
      await receiveStock({
        supplier_id: receiveSupplier,
        items: validItems.map(({ _key, ...rest }) => rest),
      });
      setIsReceiveStockOpen(false);
      fetchBatches();
      fetchIngredients();
    } catch (err: any) {
      setReceiveModalFeedback({ type: 'error', message: extractErrorMessage(err, 'Failed to receive stock.') });
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // ── BATCH DELETE HANDLER ──
  const handleDeleteBatchSubmit = async () => {
    if (!deletingBatch) return;
    setBatchDeleteSubmitting(true);
    setBatchDeleteFeedback(null);
    try {
      await deleteBatch(deletingBatch.id);
      setDeletingBatch(null);
      fetchBatches();
      fetchIngredients();
    } catch (err: any) {
      setBatchDeleteFeedback({ type: 'error', message: extractErrorMessage(err, 'Failed to delete batch.') });
    } finally {
      setBatchDeleteSubmitting(false);
    }
  };

  // ── FILTERING ──
  const filteredIngredients = ingredients.filter((ing) => {
    const query = ingredientSearchDebounced.toLowerCase();
    return ing.name.toLowerCase().includes(query);
  });

  const filteredBatches = batches.filter((b) => {
    const query = batchSearchDebounced.toLowerCase();
    return (
      b.ingredient.name.toLowerCase().includes(query) ||
      b.supplier_order.supplier.name.toLowerCase().includes(query)
    );
  });

  // ── BATCH ROW HELPERS ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const getBatchRowClass = (batch: Batch) => {
    const expiry = new Date(batch.expiry);
    expiry.setHours(0, 0, 0, 0);
    const isDepleted = Number(batch.quantity_remaining) === 0;

    if (isDepleted) return 'opacity-50';
    if (expiry < today) return 'bg-destructive/8 dark:bg-destructive/10';
    if (expiry <= in7Days) return 'bg-amber-500/8 dark:bg-amber-500/10';
    return '';
  };

  const isBatchUnused = (batch: Batch) => {
    return Number(batch.quantity_received) === Number(batch.quantity_remaining);
  };

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Boxes className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage ingredient catalog, receive supplier deliveries, and monitor stock levels in real time.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-fit">
          <TabsTrigger value="ingredients" className="gap-1.5">
            <Package className="size-4" /> Ingredients
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-1.5">
            <Boxes className="size-4" /> Stock Batches
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ INGREDIENTS TAB ═══════════════ */}
        <TabsContent value="ingredients" className="mt-4 flex flex-col gap-4">
          {/* Toolbar */}
          <InventoryToolbar
            ingredientSearch={ingredientSearch}
            setIngredientSearch={setIngredientSearch}
            filteredCount={filteredIngredients.length}
            totalCount={ingredients.length}
            isAdmin={isAdmin}
            onAddIngredient={handleOpenAddIngredient}
            onAdjustStock={handleOpenAdjustStock}
          />

          <IngredientsList
            ingredientsLoading={ingredientsLoading}
            ingredients={ingredients}
            filteredIngredients={filteredIngredients}
            ingredientsError={ingredientsError}
            isAdmin={isAdmin}
            onFetch={fetchIngredients}
            onEdit={handleOpenEditIngredient}
            onDelete={(ing) => { setDeletingIngredient(ing); setIngModalFeedback(null); }}
          />
        </TabsContent>

        {/* ═══════════════ STOCK BATCHES TAB ═══════════════ */}
        <TabsContent value="batches" className="mt-4 flex flex-col gap-4">
          {/* Toolbar */}
          <BatchToolbar
            batchSearch={batchSearch}
            setBatchSearch={setBatchSearch}
            batchIngredientFilter={batchIngredientFilter}
            setBatchIngredientFilter={setBatchIngredientFilter}
            ingredients={ingredients}
            filteredCount={filteredBatches.length}
            totalCount={batches.length}
            onReceiveStock={handleOpenReceiveStock}
            onAdjustStock={handleOpenAdjustStock}
          />

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground select-none px-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-destructive/30 border border-destructive/40" /> Expired
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-500/30 border border-amber-500/40" /> Expires within 7 days
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-muted border border-border opacity-50" /> Fully depleted
            </div>
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
                    <th className="p-4 w-15 text-center">Actions</th>
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
                        <td className="p-4 text-center"><div className="size-6 bg-muted rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : batchesError ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-destructive">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="size-8 animate-bounce" />
                          <p className="font-semibold">Failed to load stock batches</p>
                          <p className="text-xs text-muted-foreground max-w-sm">{batchesError}</p>
                          <Button variant="outline" size="sm" onClick={fetchBatches} className="mt-2">Try Again</Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Boxes className="size-10 text-muted-foreground/30" />
                          <div>
                            <p className="font-medium text-foreground">No stock batches found</p>
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                              {batches.length === 0 ? 'Receive your first stock delivery to get started.' : 'Try adjusting your search or filter.'}
                            </p>
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
                        <tr
                          key={batch.id}
                          className={`hover:bg-muted/40 transition-colors select-none cursor-context-menu ${getBatchRowClass(batch)}`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const btn = e.currentTarget.querySelector('.action-btn-trigger');
                            if (btn) {
                              const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                              btn.dispatchEvent(event);
                            }
                          }}
                        >
                          {/* Ingredient */}
                          <td className={`p-4 font-semibold text-card-foreground ${isDepleted ? 'line-through' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                                <Package className="size-4" />
                              </div>
                              <span className="truncate">{batch.ingredient.name}</span>
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="p-4 text-muted-foreground text-xs font-medium">
                            {batch.supplier_order.supplier.name}
                          </td>

                          {/* Qty Received */}
                          <td className="p-4 font-mono text-xs text-muted-foreground">
                            {Number(batch.quantity_received).toFixed(1)} {batch.ingredient.unit}
                          </td>

                          {/* Qty Remaining */}
                          <td className="p-4 font-mono text-xs font-semibold">
                            {Number(batch.quantity_remaining).toFixed(1)} {batch.ingredient.unit}
                          </td>

                          {/* Cost/Unit */}
                          <td className="p-4 font-mono text-xs text-muted-foreground">
                            ₱{Number(batch.cost_per_unit).toFixed(2)}
                          </td>

                          {/* Expiry */}
                          <td className="p-4 text-xs font-mono whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                  const exp = new Date(batch.expiry);
                                  exp.setHours(0, 0, 0, 0);
                                  if (exp < today) return <AlertTriangle className="size-3.5 text-destructive" />;
                                  if (exp <= in7Days) return <AlertTriangle className="size-3.5 text-amber-500" />;
                                  return <CalendarIcon className="size-3.5 text-foreground" />;
                              })()}
                              {expiryDate.toLocaleDateString()}
                            </div>
                          </td>

                          {/* Received */}
                          <td className="p-4 hidden lg:table-cell text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {receivedDate.toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center select-none">
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 hover:bg-muted/80 action-btn-trigger"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                                    e.currentTarget.dispatchEvent(event);
                                  }}
                                >
                                  <MoreHorizontal className="size-4.5" />
                                </Button>
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                                <ContextMenuItem
                                  onSelect={() => handleOpenAdjustSpecificBatch(batch)}
                                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-muted focus:bg-muted transition cursor-pointer"
                                >
                                  <Scale className="size-3.5 text-primary" />
                                  Report Spillage/Expiry
                                </ContextMenuItem>
                                {isAdmin && isBatchUnused(batch) && (
                                  <ContextMenuItem
                                    onSelect={() => { setDeletingBatch(batch); setBatchDeleteFeedback(null); }}
                                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition cursor-pointer"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Delete Batch
                                  </ContextMenuItem>
                                )}
                              </ContextMenuContent>
                            </ContextMenu>
                          </td>
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
            <BatchesList
              batchesLoading={batchesLoading}
              batches={batches}
              filteredBatches={filteredBatches}
              batchesError={batchesError}
              isAdmin={isAdmin}
              onFetch={fetchBatches}
              getBatchRowClass={getBatchRowClass}
              isBatchUnused={isBatchUnused}
              onDelete={(b) => { setDeletingBatch(b); setBatchDeleteFeedback(null); }}
              onAdjust={handleOpenAdjustSpecificBatch}
            />

          </div>
        </TabsContent>
      </Tabs>

      {/* Modals & dialogs */}
      <AddEditIngredientModal
        mode="add"
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        name={ingFormName}
        setName={setIngFormName}
        unit={ingFormUnit}
        setUnit={setIngFormUnit}
        threshold={ingFormThreshold}
        setThreshold={setIngFormThreshold}
        imagePreview={ingFormImagePreview}
        onImageClick={() => ingFileInputRef.current?.click()}
        onImageChange={handleIngImageChange}
        onClearImage={clearIngImage}
        fileInputRef={ingFileInputRef}
        onSubmit={handleAddIngredientSubmit}
        submitting={ingSubmitting}
        feedback={ingModalFeedback}
      />

      <AddEditIngredientModal
        mode="edit"
        isOpen={!!editingIngredient}
        onClose={() => setEditingIngredient(null)}
        name={ingFormName}
        setName={setIngFormName}
        unit={ingFormUnit}
        setUnit={setIngFormUnit}
        threshold={ingFormThreshold}
        setThreshold={setIngFormThreshold}
        imagePreview={ingFormImagePreview}
        onImageClick={() => ingFileInputRef.current?.click()}
        onImageChange={handleIngImageChange}
        onClearImage={clearIngImage}
        fileInputRef={ingFileInputRef}
        onSubmit={handleEditIngredientSubmit}
        submitting={ingSubmitting}
        feedback={ingModalFeedback}
      />

      <ReceiveStockModal
        isOpen={isReceiveStockOpen}
        onClose={() => setIsReceiveStockOpen(false)}
        suppliers={suppliers}
        ingredients={ingredients}
        receiveSupplier={receiveSupplier}
        setReceiveSupplier={setReceiveSupplier}
        receiveItems={receiveItems}
        addReceiveItem={addReceiveItem}
        removeReceiveItem={removeReceiveItem}
        updateReceiveItem={updateReceiveItem}
        onSubmit={handleReceiveStockSubmit}
        submitting={receiveSubmitting}
        feedback={receiveModalFeedback}
      />

      <DeleteIngredientDialog
        item={deletingIngredient}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={handleDeleteIngredientSubmit}
        submitting={ingSubmitting}
        feedback={ingModalFeedback}
      />

      <DeleteBatchDialog
        item={deletingBatch}
        onClose={() => setDeletingBatch(null)}
        onConfirm={handleDeleteBatchSubmit}
        submitting={batchDeleteSubmitting}
        feedback={batchDeleteFeedback}
      />

      <AdjustStockModal
        isOpen={isAdjustStockOpen}
        onClose={() => setIsAdjustStockOpen(false)}
        ingredients={ingredients}
        onSuccess={() => {
          fetchIngredients();
          fetchBatches();
        }}
        preSelectedIngredientId={adjustPreselectedIngredientId}
        preSelectedBatchId={adjustPreselectedBatchId}
      />
    </div>
  );
}
