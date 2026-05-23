import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ImagePlus,
  Boxes,
  Search,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  LoaderCircle,
  AlertCircle,
  Check,
  X,
  Package,
  TrendingDown,
  AlertTriangle,
  PackagePlus,
  Calendar as CalendarIcon,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// ── Constants ──────────────────────────────────────────────────
const UNIT_OPTIONS: { value: Unit; label: string }[] = [
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

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const isError = feedback.type === 'error';
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
        isError
          ? 'border border-destructive/20 bg-destructive/10 text-destructive'
          : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      }`}
    >
      {isError ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
      {feedback.message}
    </div>
  );
}

function StockBadge({ currentStock, threshold }: { currentStock: number; threshold: number }) {
  if (currentStock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
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
  const [ingFormThreshold, setIngFormThreshold] = useState('5');
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
    setIngFormThreshold('5');
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
        low_stock_threshold: parseFloat(ingFormThreshold) || 5,
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
        low_stock_threshold: parseFloat(ingFormThreshold) || 5,
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
    if (expiry < today) return 'bg-rose-500/8 dark:bg-rose-500/10';
    if (expiry <= in7Days) return 'bg-amber-500/8 dark:bg-amber-500/10';
    return '';
  };

  const isBatchUnused = (batch: Batch) => {
    return Number(batch.quantity_received) === Number(batch.quantity_remaining);
  };

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-400 mx-auto">
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
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                placeholder="Search ingredients by name..."
                className="pl-9 w-full h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground select-none">
                Showing <span className="font-semibold text-card-foreground">{filteredIngredients.length}</span> of {ingredients.length}
              </div>
              {isAdmin && (
                <Button
                  onClick={handleOpenAddIngredient}
                  className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5"
                >
                  <Plus className="size-4" /> Add Ingredient
                </Button>
              )}
            </div>
          </div>

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
                          <Button variant="outline" size="sm" onClick={fetchIngredients} className="mt-2">Try Again</Button>
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
                          if (!isAdmin) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const btn = e.currentTarget.querySelector('.action-btn-trigger');
                          if (btn) {
                            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                            btn.dispatchEvent(event);
                          }
                        }}
                      >
                        {/* Name */}
                        <td className="p-4 font-semibold text-card-foreground">
                          <div className="flex items-center gap-3 min-w-0">
                            {ing.img_path ? (
                              <img
                                src={ing.img_path}
                                alt={ing.name}
                                className="size-8 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                                <Package className="size-4" />
                              </div>
                            )}
                            <span className="truncate">{ing.name}</span>
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="p-4 text-muted-foreground">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                            {ing.unit}
                          </span>
                        </td>

                        {/* Threshold */}
                        <td className="p-4 text-muted-foreground font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <TrendingDown className="size-3.5 text-muted-foreground/70" />
                            {Number(ing.low_stock_threshold).toFixed(1)} {ing.unit}
                          </div>
                        </td>

                        {/* Current Stock */}
                        <td className="p-4 font-mono text-sm font-semibold">
                          {ing.current_stock.toFixed(1)} {ing.unit}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <StockBadge currentStock={ing.current_stock} threshold={Number(ing.low_stock_threshold)} />
                        </td>

                        {/* Actions */}
                        {isAdmin && (
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
                                  onSelect={() => handleOpenEditIngredient(ing)}
                                  className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                                >
                                  <Edit3 className="size-3.5 text-muted-foreground" />
                                  Edit Ingredient
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onSelect={() => { setDeletingIngredient(ing); setIngModalFeedback(null); }}
                                  className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete Ingredient
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
              <div className="p-6 text-center text-rose-500 border border-border bg-card rounded-xl">
                {ingredientsError}
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-border bg-card rounded-xl">
                No ingredients found.
              </div>
            ) : (
              filteredIngredients.map((ing) => (
                <div
                  key={ing.id}
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-context-menu"
                  onContextMenu={(e) => {
                    if (!isAdmin) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = e.currentTarget.querySelector('.action-btn-trigger');
                    if (btn) {
                      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                      btn.dispatchEvent(event);
                    }
                  }}
                >
                  {/* Column 1: Image, Name, Unit, and Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    {ing.img_path ? (
                      <img
                        src={ing.img_path}
                        alt={ing.name}
                        className="size-10 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                        <Package className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className="font-semibold text-card-foreground truncate text-sm">{ing.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground uppercase">
                          {ing.unit}
                        </span>
                        <StockBadge currentStock={ing.current_stock} threshold={Number(ing.low_stock_threshold)} />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Current Stock, Threshold and Inline Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-foreground">
                        {ing.current_stock.toFixed(1)} {ing.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Min: {Number(ing.low_stock_threshold).toFixed(1)}
                      </p>
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
                              const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                              e.currentTarget.dispatchEvent(event);
                            }}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                          <ContextMenuItem
                            onSelect={() => handleOpenEditIngredient(ing)}
                            className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                          >
                            <Edit3 className="size-3.5 text-muted-foreground" />
                            Edit Ingredient
                          </ContextMenuItem>
                          <ContextMenuItem
                            onSelect={() => { setDeletingIngredient(ing); setIngModalFeedback(null); }}
                            className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                            Delete Ingredient
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ═══════════════ STOCK BATCHES TAB ═══════════════ */}
        <TabsContent value="batches" className="mt-4 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  placeholder="Search by ingredient or supplier..."
                  className="pl-9 w-full h-9 text-sm"
                />
              </div>
              {/* Ingredient filter */}
              <Select
                value={batchIngredientFilter || 'all-ingredients'}
                onValueChange={(val) => setBatchIngredientFilter(val === 'all-ingredients' ? '' : val)}
              >
                <SelectTrigger className="h-9 w-40 text-xs font-medium bg-background border border-border shadow-none">
                  <SelectValue placeholder="All Ingredients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-ingredients">All Ingredients</SelectItem>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground select-none">
                Showing <span className="font-semibold text-card-foreground">{filteredBatches.length}</span> of {batches.length}
              </div>
              <Button
                onClick={handleOpenReceiveStock}
                className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5"
              >
                <PackagePlus className="size-4" /> Receive Stock
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground select-none px-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-rose-500/30 border border-rose-500/40" /> Expired
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
                          <Button variant="outline" size="sm" onClick={fetchBatches} className="mt-2">Try Again</Button>
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
                            if (!isAdmin || !isBatchUnused(batch)) return;
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
                                if (exp < today) return <AlertTriangle className="size-3.5 text-rose-500" />;
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
                          {isAdmin && (
                            <td className="p-4 text-center select-none">
                              {isBatchUnused(batch) ? (
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
                                      onSelect={() => { setDeletingBatch(batch); setBatchDeleteFeedback(null); }}
                                      className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                      Delete Batch
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
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-3.5 bg-muted rounded w-20" />
                </div>
              ))
            ) : batchesError ? (
              <div className="p-6 text-center text-rose-500 border border-border bg-card rounded-xl">
                {batchesError}
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-border bg-card rounded-xl">
                No stock batches found.
              </div>
            ) : (
              filteredBatches.map((batch) => {
                const expiryDate = new Date(batch.expiry);
                const isDepleted = Number(batch.quantity_remaining) === 0;

                return (
                  <div
                    key={batch.id}
                    className={`rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors cursor-context-menu ${getBatchRowClass(batch)}`}
                    onContextMenu={(e) => {
                      if (!isAdmin || !isBatchUnused(batch)) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const btn = e.currentTarget.querySelector('.action-btn-trigger');
                      if (btn) {
                        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                        btn.dispatchEvent(event);
                      }
                    }}
                  >
                    {/* Column 1: Name, Supplier, and Expiry Highlight */}
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-card-foreground text-sm truncate ${isDepleted ? 'line-through opacity-60' : ''}`}>
                          {batch.ingredient.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono font-medium bg-muted px-1.5 py-0.5 rounded">
                          {batch.ingredient.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        From: <span className="font-semibold text-foreground">{batch.supplier_order.supplier.name}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        {(() => {
                          const exp = new Date(batch.expiry);
                          exp.setHours(0, 0, 0, 0);
                          if (exp < today) return <AlertTriangle className="size-3 text-rose-500 shrink-0" />;
                          if (exp <= in7Days) return <AlertTriangle className="size-3 text-amber-500 shrink-0" />;
                          return <CalendarIcon className="size-3 text-muted-foreground shrink-0" />;
                        })()}
                        Exp: {expiryDate.toLocaleDateString()}
                      </div>
                    </div>

                    {/* Column 2: Quantities, Cost, and Inline Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-foreground">
                          {Number(batch.quantity_remaining).toFixed(1)} remaining
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Recv: {Number(batch.quantity_received).toFixed(1)} · ₱{Number(batch.cost_per_unit).toFixed(2)}/u
                        </p>
                      </div>
                      {isAdmin && isBatchUnused(batch) && (
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 hover:bg-muted/85 action-btn-trigger shrink-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                                e.currentTarget.dispatchEvent(event);
                              }}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                            <ContextMenuItem
                              onSelect={() => { setDeletingBatch(batch); setBatchDeleteFeedback(null); }}
                              className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                              Delete Batch
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* ── ADD INGREDIENT MODAL ── */}
      {isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="size-5 text-primary" /> Add New Ingredient
              </h2>
              <button onClick={() => setIsAddIngredientOpen(false)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddIngredientSubmit} className="flex flex-col gap-4">
              {/* Image Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Image</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => ingFileInputRef.current?.click()}
                    className="relative size-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-primary transition cursor-pointer overflow-hidden group"
                  >
                    {ingFormImagePreview ? (
                      <img src={ingFormImagePreview} alt="Preview" className="size-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus className="size-5" />
                        <span className="text-[9px] font-medium">Upload</span>
                      </div>
                    )}
                  </button>
                  {ingFormImagePreview && (
                    <button type="button" onClick={clearIngImage} className="text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition underline">
                      Remove
                    </button>
                  )}
                  <input
                    ref={ingFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleIngImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Ingredient Name <span className="text-rose-500">*</span></label>
                <Input value={ingFormName} onChange={(e) => setIngFormName(e.target.value)} placeholder="e.g., Espresso Beans" className="h-10 text-sm" maxLength={50} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">Unit <span className="text-rose-500">*</span></label>
                  <Select value={ingFormUnit} onValueChange={(val) => setIngFormUnit(val as Unit)}>
                    <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-sm font-medium text-foreground">
                      <SelectValue placeholder="Select unit…" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">Low Stock Alert</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ingFormThreshold}
                    onChange={(e) => setIngFormThreshold(e.target.value)}
                    placeholder="5.0"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              {ingModalFeedback && <FeedbackBanner feedback={ingModalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddIngredientOpen(false)} disabled={ingSubmitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button type="submit" disabled={ingSubmitting} className="h-9 px-4 text-xs font-semibold">
                  {ingSubmitting ? <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Saving…</span> : 'Add Ingredient'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT INGREDIENT MODAL ── */}
      {editingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Edit Ingredient
              </h2>
              <button onClick={() => setEditingIngredient(null)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditIngredientSubmit} className="flex flex-col gap-4">
              {/* Image Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Image</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => ingFileInputRef.current?.click()}
                    className="relative size-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-primary transition cursor-pointer overflow-hidden group"
                  >
                    {ingFormImagePreview ? (
                      <img src={ingFormImagePreview} alt="Preview" className="size-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus className="size-5" />
                        <span className="text-[9px] font-medium">Upload</span>
                      </div>
                    )}
                  </button>
                  {ingFormImagePreview && (
                    <button type="button" onClick={clearIngImage} className="text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition underline">
                      Remove
                    </button>
                  )}
                  <input
                    ref={ingFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleIngImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Ingredient Name <span className="text-rose-500">*</span></label>
                <Input value={ingFormName} onChange={(e) => setIngFormName(e.target.value)} placeholder="Ingredient Name" className="h-10 text-sm" maxLength={50} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">Unit <span className="text-rose-500">*</span></label>
                  <Select value={ingFormUnit} onValueChange={(val) => setIngFormUnit(val as Unit)}>
                    <SelectTrigger className="h-10 w-full bg-background border border-border shadow-none text-sm font-medium text-foreground">
                      <SelectValue placeholder="Select unit…" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">Low Stock Alert</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ingFormThreshold}
                    onChange={(e) => setIngFormThreshold(e.target.value)}
                    placeholder="5.0"
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              {ingModalFeedback && <FeedbackBanner feedback={ingModalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setEditingIngredient(null)} disabled={ingSubmitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button type="submit" disabled={ingSubmitting} className="h-9 px-4 text-xs font-semibold">
                  {ingSubmitting ? <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Saving…</span> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE INGREDIENT CONFIRMATION MODAL ── */}
      {deletingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
              </h2>
              <button onClick={() => setDeletingIngredient(null)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-card-foreground">
                Are you absolutely sure you want to permanently delete <span className="font-bold text-foreground">"{deletingIngredient.name}"</span>?
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>CASCADE WARNING:</strong> This will permanently remove all associated stock batches and recipe links. Products that only use this ingredient will also be deleted.
                </span>
              </div>
            </div>

            {ingModalFeedback && <div className="mt-4"><FeedbackBanner feedback={ingModalFeedback} /></div>}

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
              <Button type="button" variant="outline" onClick={() => setDeletingIngredient(null)} disabled={ingSubmitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
              <Button onClick={handleDeleteIngredientSubmit} disabled={ingSubmitting} variant="destructive" className="h-9 px-4 text-xs font-semibold">
                {ingSubmitting ? <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Deleting…</span> : 'Delete Ingredient'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIVE STOCK MODAL ── */}
      {isReceiveStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PackagePlus className="size-5 text-primary" /> Receive Stock Delivery
              </h2>
              <button onClick={() => setIsReceiveStockOpen(false)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="flex flex-col gap-5">
              {/* Supplier Selection */}
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

              {/* Line Items */}
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
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Item #{index + 1}
                        </span>
                        {receiveItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReceiveItem(item._key)}
                            className="size-6 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-rose-500 transition"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Ingredient */}
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[11px] font-medium text-muted-foreground">Ingredient <span className="text-rose-500">*</span></label>
                          <Select
                            value={item.ingredient_id}
                            onValueChange={(val) => updateReceiveItem(item._key, 'ingredient_id', val)}
                          >
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

                        {/* Quantity */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-muted-foreground">Quantity <span className="text-rose-500">*</span></label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={item.quantity_received || ''}
                            onChange={(e) => updateReceiveItem(item._key, 'quantity_received', parseFloat(e.target.value) || 0)}
                            placeholder="0.000"
                            className="h-9 text-xs font-mono"
                            required
                          />
                        </div>

                        {/* Cost/Unit */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-muted-foreground">Cost per Unit (₱)</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.cost_per_unit || ''}
                            onChange={(e) => updateReceiveItem(item._key, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-9 text-xs font-mono"
                          />
                        </div>

                        {/* Expiry */}
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[11px] font-medium text-muted-foreground">Expiry Date <span className="text-rose-500">*</span></label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-9 w-full justify-start text-left text-xs font-mono font-normal shadow-none border border-border bg-background hover:bg-muted/40",
                                  !item.expiry && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
                                {item.expiry ? (
                                  format(new Date(item.expiry), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-100 bg-card border border-border rounded-lg shadow-md" align="start">
                              <Calendar
                                mode="single"
                                selected={item.expiry ? new Date(item.expiry) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const yyyy = date.getFullYear();
                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                    const dd = String(date.getDate()).padStart(2, '0');
                                    updateReceiveItem(item._key, 'expiry', `${yyyy}-${mm}-${dd}`);
                                  }
                                }}
                                captionLayout="dropdown"
                                startMonth={new Date(new Date().getFullYear() - 5, 0)}
                                endMonth={new Date(new Date().getFullYear() + 10, 11)}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {receiveModalFeedback && <FeedbackBanner feedback={receiveModalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-1">
                <Button type="button" variant="outline" onClick={() => setIsReceiveStockOpen(false)} disabled={receiveSubmitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
                <Button type="submit" disabled={receiveSubmitting} className="h-9 px-4 text-xs font-semibold">
                  {receiveSubmitting ? (
                    <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Processing…</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5"><PackagePlus className="size-3.5" /> Receive {receiveItems.length} Item{receiveItems.length > 1 ? 's' : ''}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE BATCH CONFIRMATION MODAL ── */}
      {deletingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Delete Unused Batch
              </h2>
              <button onClick={() => setDeletingBatch(null)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-card-foreground">
                Remove the stock batch for <span className="font-bold text-foreground">"{deletingBatch.ingredient.name}"</span> received from <span className="font-bold text-foreground">{deletingBatch.supplier_order.supplier.name}</span>?
              </p>
              <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground font-mono">
                Qty: {Number(deletingBatch.quantity_received).toFixed(1)} {deletingBatch.ingredient.unit} · Cost/Unit: ₱{Number(deletingBatch.cost_per_unit).toFixed(2)} · Expiry: {new Date(deletingBatch.expiry).toLocaleDateString()}
              </div>
            </div>

            {batchDeleteFeedback && <div className="mt-4"><FeedbackBanner feedback={batchDeleteFeedback} /></div>}

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
              <Button type="button" variant="outline" onClick={() => setDeletingBatch(null)} disabled={batchDeleteSubmitting} className="h-9 px-4 text-xs font-medium">Cancel</Button>
              <Button onClick={handleDeleteBatchSubmit} disabled={batchDeleteSubmitting} variant="destructive" className="h-9 px-4 text-xs font-semibold">
                {batchDeleteSubmitting ? <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Deleting…</span> : 'Delete Batch'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
