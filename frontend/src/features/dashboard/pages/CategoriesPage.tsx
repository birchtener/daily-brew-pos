import { useEffect, useState, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit3,
  Trash2,
  LoaderCircle,
  AlertCircle,
  Check,
  X,
  Coffee,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/api/categories';
import { getProducts, type Product } from '@/api/products';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';

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

export default function CategoriesPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // ── STATE ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Inputs
  const [searchVal, setSearchVal] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  // Modal & Edit States
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsData, prodsData] = await Promise.all([getCategories(), getProducts()]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to fetch categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createCategory({ name: newCatName.trim() });
      setNewCatName('');
      setFeedback({ type: 'success', message: 'Category tag successfully created!' });
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to register category.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await updateCategory(id, { name: editingCatName.trim() });
      setEditingCatId(null);
      setEditingCatName('');
      setFeedback({ type: 'success', message: 'Category name successfully updated.' });
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to update category.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      await deleteCategory(id);
      setFeedback({ type: 'success', message: 'Category and all associated products permanently dropped.' });
      setDeletingCategory(null);
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to delete category.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Local Filter
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Tag className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Categories Catalog</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Define catalog containers for items, organize POS layouts, and handle cascade tag settings.
        </p>
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Add Category Tag Form */}
        {isAdmin && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-1">Establish Category Tag</h2>
              <p className="text-[11px] text-muted-foreground">
                Define a singular category to organize recipes and items in checkout lines.
              </p>
            </div>

            <form onSubmit={handleAddCategory} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Category Name</label>
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Cold Brew Infusions"
                  className="h-10 text-sm"
                  maxLength={50}
                  disabled={submitting}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !newCatName.trim()}
                className="w-full h-9.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" /> Add Category
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Right Area: Categories list and search */}
        <div className={`flex flex-col gap-4 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Toolbar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search categories by name..."
                className="pl-9 w-full h-9 text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground shrink-0 select-none">
              Showing <span className="font-semibold text-card-foreground">{filteredCategories.length}</span> of {categories.length} categories
            </div>
          </div>

          {/* Grid Layout of Categories */}
          {loading && categories.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-card h-28 p-4 flex flex-col justify-between" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500 border border-border bg-card rounded-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="size-8 animate-bounce" />
                <p className="font-semibold">Failed to load categories</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl">
              <div className="flex flex-col items-center justify-center gap-3">
                <Tag className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-foreground">No categories found</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    {categories.length === 0 ? 'Create a category to begin classifying your POS products!' : 'Try modifying your search query.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCategories.map((c) => {
                const isEditing = editingCatId === c.id;
                const linkedProductsCount = products.filter((p) => p.category_id === c.id).length;

                return (
                  <div
                    key={c.id}
                    className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col justify-between h-28"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Input
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="h-8.5 text-xs font-semibold"
                          maxLength={50}
                          disabled={submitting}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 self-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCatId(null);
                              setEditingCatName('');
                            }}
                            disabled={submitting}
                            className="h-7 px-2 text-[10px] text-muted-foreground"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCategory(c.id)}
                            disabled={submitting || !editingCatName.trim()}
                            className="h-7 px-3 text-[10px] font-semibold"
                          >
                            {submitting ? 'Saving…' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground text-sm tracking-tight truncate" title={c.name}>
                              {c.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15 text-[10px] font-bold text-primary">
                              <Coffee className="size-3" /> {linkedProductsCount} Product{linkedProductsCount !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1 select-none shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => {
                                  setEditingCatId(c.id);
                                  setEditingCatName(c.name);
                                  setFeedback(null);
                                }}
                                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                                title="Edit category name"
                              >
                                <Edit3 className="size-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingCategory(c);
                                  setFeedback(null);
                                }}
                                className="size-7 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-rose-500 transition"
                                title="Delete category"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-muted-foreground flex justify-between items-center border-t border-border/40 pt-2 font-mono">
                          <span>Updated: {new Date(c.updated_at).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CASCADE DELETE CONFIRMATION MODAL ────────────────────── */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
              </h2>
              <button
                onClick={() => setDeletingCategory(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1 text-left">
              <p className="text-sm text-card-foreground">
                Are you absolutely sure you want to permanently delete the category <span className="font-bold text-foreground">"{deletingCategory.name}"</span>?
              </p>
              
              {(() => {
                const count = products.filter((p) => p.category_id === deletingCategory.id).length;
                if (count > 0) {
                  return (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>CRITICAL DANGER:</strong> There are currently <strong>{count} product(s)</strong> registered inside this category. If you proceed, <strong>all of these products, along with their ingredient formulas/recipes</strong>, will be permanently deleted from the database.
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-600 dark:text-yellow-400 flex gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>
                      This category is currently empty. Deleting it will safely remove the category container with zero item cascade drops.
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCategory(null)}
                disabled={submitting}
                className="h-9 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteCategory(deletingCategory.id)}
                disabled={submitting}
                variant="destructive"
                className="h-9 px-4 text-xs font-semibold"
              >
                {submitting ? 'Deleting…' : 'Delete Category'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
