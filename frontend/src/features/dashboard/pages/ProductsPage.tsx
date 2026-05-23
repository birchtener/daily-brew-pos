import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ImagePlus,
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
  Coffee,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from '@/api/products';
import {
  getCategories,
  type Category,
} from '@/api/categories';
import {
  getIngredients,
  type Ingredient,
  type Unit,
} from '@/api/ingredients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function ProductsPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // ── STATE ──
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchVal, setSearchVal] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');

  // Expanded cards tracker (to view recipes inline)
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formRecipeLines, setFormRecipeLines] = useState<{ _key: number; ingredient_id: string; quantity: string; unit: Unit }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<FeedbackState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchVal);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, catsData, ingsData] = await Promise.all([
        getProducts(),
        getCategories(),
        getIngredients(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setIngredients(ingsData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch catalog data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset form states
  const resetForm = () => {
    setFormName('');
    setFormPrice('');
    setFormCategoryId('');
    setFormImage(null);
    setFormImagePreview(null);
    setFormRecipeLines([]);
    setModalFeedback(null);
    setSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open add modal
  const handleOpenAddModal = () => {
    resetForm();
    if (categories.length > 0) {
      setFormCategoryId(categories[0].id);
    }
    setIsAddModalOpen(true);
  };

  // Open edit modal prefilled
  const handleOpenEditModal = (prod: Product) => {
    resetForm();
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(String(prod.price));
    setFormCategoryId(prod.category_id);
    setFormImagePreview(prod.img_path || null);
    
    if (prod.recipes && prod.recipes.length > 0) {
      setFormRecipeLines(
        prod.recipes.map((r) => ({
          _key: Date.now() + Math.random(),
          ingredient_id: r.ingredient_id,
          quantity: String(r.quantity),
          unit: r.unit,
        }))
      );
    }
    setModalFeedback(null);
    setSubmitting(false);
  };

  // Handle Image uploads and previews
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormImage(null);
    setFormImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Recipe lines dynamic actions
  const addRecipeLine = () => {
    if (ingredients.length === 0) return;
    const defaultIng = ingredients[0];
    setFormRecipeLines((prev) => [
      ...prev,
      {
        _key: Date.now() + Math.random(),
        ingredient_id: defaultIng.id,
        quantity: '1',
        unit: defaultIng.unit,
      },
    ]);
  };

  const removeRecipeLine = (key: number) => {
    setFormRecipeLines((prev) => prev.filter((line) => line._key !== key));
  };

  const updateRecipeLine = (key: number, field: string, value: any) => {
    setFormRecipeLines((prev) =>
      prev.map((line) => {
        if (line._key === key) {
          const updatedLine = { ...line, [field]: value };
          if (field === 'ingredient_id') {
            const foundIng = ingredients.find((i) => i.id === value);
            if (foundIng) {
              updatedLine.unit = foundIng.unit;
            }
          }
          return updatedLine;
        }
        return line;
      })
    );
  };

  // Submit handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalFeedback({ type: 'error', message: 'Product name is required.' });
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setModalFeedback({ type: 'error', message: 'Please specify a positive price.' });
      return;
    }
    if (!formCategoryId) {
      setModalFeedback({ type: 'error', message: 'Category selection is required.' });
      return;
    }

    // Filter valid recipe line items
    const parsedRecipes = formRecipeLines
      .filter((line) => line.ingredient_id && parseFloat(line.quantity) > 0)
      .map((line) => ({
        ingredient_id: line.ingredient_id,
        quantity: parseFloat(line.quantity),
        unit: line.unit,
      }));

    setSubmitting(true);
    setModalFeedback(null);

    try {
      await createProduct({
        name: formName.trim(),
        price: priceNum,
        category_id: formCategoryId,
        image: formImage,
        ingredients: parsedRecipes,
      });
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to register product.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formName.trim()) {
      setModalFeedback({ type: 'error', message: 'Product name is required.' });
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setModalFeedback({ type: 'error', message: 'Please specify a positive price.' });
      return;
    }
    if (!formCategoryId) {
      setModalFeedback({ type: 'error', message: 'Category selection is required.' });
      return;
    }

    const parsedRecipes = formRecipeLines
      .filter((line) => line.ingredient_id && parseFloat(line.quantity) > 0)
      .map((line) => ({
        ingredient_id: line.ingredient_id,
        quantity: parseFloat(line.quantity),
        unit: line.unit,
      }));

    setSubmitting(true);
    setModalFeedback(null);
    const isImageCleared = formImagePreview === null && editingProduct.img_path !== null;

    try {
      await updateProduct(editingProduct.id, {
        name: formName.trim(),
        price: priceNum,
        category_id: formCategoryId,
        image: formImage,
        ...(isImageCleared ? { img_path: null } : {}),
        ingredients: parsedRecipes,
      });
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to update product details.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    setModalFeedback(null);
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      fetchData();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to delete product.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle expanded recipe card
  const toggleExpanded = (id: string) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtering local list
  const filteredProducts = products.filter((p) => {
    const query = searchDebounced.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.category.name.toLowerCase().includes(query);
    const matchesCategory =
      categoryFilter === 'all-categories' || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-400 mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Products Catalog</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure beverages and bakery goods, manage ingredients formulas, and edit retail pricing details.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenAddModal}
            className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            <Plus className="size-4" /> Add Product
          </Button>
        )}
      </div>

      {/* Toolbar / Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products by title or category..."
              className="pl-9 w-full h-9 text-sm"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="h-9 w-44 text-xs font-medium bg-background border border-border shadow-none shrink-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground select-none shrink-0">
          Showing <span className="font-semibold text-card-foreground">{filteredProducts.length}</span> of {products.length} products
        </div>
      </div>

      {/* Main Grid View */}
      {loading && products.length === 0 ? (
        // Skeleton Loader
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card overflow-hidden h-80 flex flex-col justify-between p-4">
              <div className="h-40 bg-muted rounded-xl w-full" />
              <div className="flex flex-col gap-2 mt-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="h-8 bg-muted rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-500 border border-border bg-card rounded-xl">
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertCircle className="size-8 animate-bounce" />
            <p className="font-semibold">Failed to load product catalog</p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <Coffee className="size-10 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">No products found</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                {products.length === 0 ? 'Create your first product item to get started!' : 'Try modifying your filter or search query.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isExpanded = !!expandedProducts[product.id];
            const recipeCount = product.recipes?.length || 0;

            return (
              <ContextMenu key={product.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between select-none cursor-context-menu"
                  >
                    {/* Upper Content */}
                    <div>
                      {/* Image Header with Actions absolute */}
                      <div className="relative h-40 w-full overflow-hidden bg-muted flex items-center justify-center">
                        {product.img_path ? (
                          <img
                            src={product.img_path}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-linear-to-tr from-primary/10 to-primary/5 flex flex-col items-center justify-center text-primary/70">
                            <Coffee className="size-10 stroke-[1.5] mb-1" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Daily Brew Classic</span>
                          </div>
                        )}

                        {/* Category Label Overlay */}
                        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/10">
                          {product.category.name}
                        </span>

                        {/* Top-Right Context Button Trigger */}
                        {isAdmin && (
                          <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg bg-black/50 hover:bg-black/75 backdrop-blur-md text-white hover:text-white border border-white/10 action-btn-trigger shadow"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY });
                                e.currentTarget.dispatchEvent(event);
                              }}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Details Area */}
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground tracking-tight text-sm line-clamp-1 truncate" title={product.name}>
                            {product.name}
                          </h3>
                          <span className="font-mono text-sm font-bold text-primary shrink-0">
                            ₱{Number(product.price).toFixed(2)}
                          </span>
                        </div>

                        {/* Ingredients Counter / Formula expander button */}
                        {recipeCount > 0 ? (
                          <button
                            onClick={() => toggleExpanded(product.id)}
                            className="inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-muted/65 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground font-medium transition"
                          >
                            <span className="flex items-center gap-1">
                              <Package className="size-3.5 text-primary/70" />
                              Recipe formula: {recipeCount} item{recipeCount > 1 ? 's' : ''}
                            </span>
                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-500 font-semibold select-none">
                            <AlertCircle className="size-3.5" /> No ingredients linked to recipe
                          </div>
                        )}

                        {/* Expanded details container */}
                        {isExpanded && product.recipes && (
                          <div className="mt-1 border-t border-border/60 pt-2 flex flex-col gap-1.5 max-h-27.5 overflow-y-auto pr-1 animate-in slide-in-from-top-1 duration-200">
                            {product.recipes.map((rec) => (
                              <div key={rec.id} className="flex justify-between items-center text-[10px]">
                                <span className="text-muted-foreground truncate max-w-28 font-medium">
                                  • {rec.ingredient.name}
                                </span>
                                <span className="font-mono text-foreground/80 bg-muted px-1.5 py-0.5 rounded font-bold">
                                  {Number(rec.quantity).toFixed(1)} {rec.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lower Area Actions for normal triggers */}
                    {isAdmin && (
                      <div className="p-4 pt-0">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenEditModal(product)}
                          className="w-full h-8 text-[11px] font-semibold border-muted-foreground/15 hover:bg-primary/5 hover:text-primary transition"
                        >
                          <Edit3 className="size-3 mr-1" /> Configure Product
                        </Button>
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
                  <ContextMenuItem
                    onSelect={() => handleOpenEditModal(product)}
                    className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                  >
                    <Edit3 className="size-3.5 text-muted-foreground" />
                    Configure Product
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => {
                      setDeletingProduct(product);
                      setModalFeedback(null);
                    }}
                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Product
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      )}

      {/* ── ADD PRODUCT MODAL ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Coffee className="size-5 text-primary" /> Register New Product
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {/* Image Upload Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Product Display Image</label>
                <div className="flex items-center gap-4">
                  {formImagePreview ? (
                    <div className="relative size-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                      <img src={formImagePreview} alt="Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-1 top-1 size-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="size-20 rounded-xl border border-dashed border-muted-foreground/35 hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center text-muted-foreground shrink-0"
                    >
                      <ImagePlus className="size-5 mb-1" />
                      <span className="text-[10px] font-medium">Upload</span>
                    </button>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">Product Image</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-70">
                      Provide a clear JPEG or PNG layout. File uploads map seamlessly to remote cloud storage.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2.5 text-[10px] mt-2 font-medium"
                    >
                      Browse local files
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Iced Matcha Latte"
                    className="h-10 text-sm"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">
                    Retail Price (₱) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g., 140.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-10 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Category Tag <span className="text-rose-500">*</span>
                </label>
                {categories.length > 0 ? (
                  <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                    <SelectTrigger className="h-10 text-sm bg-background border border-border">
                      <SelectValue placeholder="Select Category Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-rose-500 font-semibold italic">Please create a Category under Inventory settings first.</p>
                )}
              </div>

              {/* Recipe Formula Builder */}
              <div className="border-t border-border pt-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-semibold text-card-foreground flex items-center gap-1">
                      Recipe Recipe-Formula Builder
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      List the precise ingredients quantities consumed per standard cup.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipeLine}
                    disabled={ingredients.length === 0}
                    className="h-7 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 shrink-0 inline-flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add Row
                  </Button>
                </div>

                {formRecipeLines.length === 0 ? (
                  <div className="text-center py-6 px-4 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground select-none text-[11px]">
                    No recipe items linked. This product will register without automatically consuming inventory stocks upon sales.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-45 overflow-y-auto pr-1">
                    {formRecipeLines.map((line) => (
                      <div key={line._key} className="flex items-center gap-2 animate-in fade-in duration-200">
                        {/* Ingredient Dropdown */}
                        <div className="flex-1 min-w-0">
                          <Select
                            value={line.ingredient_id}
                            onValueChange={(val) => updateRecipeLine(line._key, 'ingredient_id', val)}
                          >
                            <SelectTrigger className="h-8.5 text-[11px] bg-background border border-border">
                              <SelectValue placeholder="Choose Ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id} className="text-[11px]">
                                  {ing.name} ({ing.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Qty Input */}
                        <div className="w-24.5 shrink-0">
                          <Input
                            value={line.quantity}
                            onChange={(e) => updateRecipeLine(line._key, 'quantity', e.target.value)}
                            placeholder="Qty"
                            type="number"
                            step="any"
                            min="0.0001"
                            className="h-8.5 text-[11px] font-mono text-center"
                            required
                          />
                        </div>

                        {/* Unit string block */}
                        <div className="w-15 text-left shrink-0 text-[10px] font-mono font-bold text-muted-foreground select-none uppercase">
                          {line.unit}
                        </div>

                        {/* Remove Line */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipeLine(line._key)}
                          className="size-8.5 text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {modalFeedback && <FeedbackBanner feedback={modalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || categories.length === 0}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                    </span>
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT PRODUCT MODAL ────────────────────────────────────── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Configure Product
              </h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {/* Image Upload Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">Product Display Image</label>
                <div className="flex items-center gap-4">
                  {formImagePreview ? (
                    <div className="relative size-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                      <img src={formImagePreview} alt="Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-1 top-1 size-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="size-20 rounded-xl border border-dashed border-muted-foreground/35 hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center text-muted-foreground shrink-0"
                    >
                      <ImagePlus className="size-5 mb-1" />
                      <span className="text-[10px] font-medium">Upload</span>
                    </button>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">Product Image</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-70">
                      Provide a clear JPEG or PNG layout. File uploads map seamlessly to remote cloud storage.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2.5 text-[10px] mt-2 font-medium"
                    >
                      Browse local files
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Iced Matcha Latte"
                    className="h-10 text-sm"
                    maxLength={50}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-card-foreground">
                    Retail Price (₱) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g., 140.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-10 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Category Tag <span className="text-rose-500">*</span>
                </label>
                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                  <SelectTrigger className="h-10 text-sm bg-background border border-border">
                    <SelectValue placeholder="Select Category Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipe Formula Builder */}
              <div className="border-t border-border pt-4 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-semibold text-card-foreground flex items-center gap-1">
                      Recipe Recipe-Formula Builder
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      List the precise ingredients quantities consumed per standard cup.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipeLine}
                    disabled={ingredients.length === 0}
                    className="h-7 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 shrink-0 inline-flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add Row
                  </Button>
                </div>

                {formRecipeLines.length === 0 ? (
                  <div className="text-center py-6 px-4 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground select-none text-[11px]">
                    No recipe items linked. This product will register without automatically consuming inventory stocks upon sales.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-45 overflow-y-auto pr-1">
                    {formRecipeLines.map((line) => (
                      <div key={line._key} className="flex items-center gap-2 animate-in fade-in duration-200">
                        {/* Ingredient Dropdown */}
                        <div className="flex-1 min-w-0">
                          <Select
                            value={line.ingredient_id}
                            onValueChange={(val) => updateRecipeLine(line._key, 'ingredient_id', val)}
                          >
                            <SelectTrigger className="h-8.5 text-[11px] bg-background border border-border">
                              <SelectValue placeholder="Choose Ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={ing.id} className="text-[11px]">
                                  {ing.name} ({ing.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Qty Input */}
                        <div className="w-24.5 shrink-0">
                          <Input
                            value={line.quantity}
                            onChange={(e) => updateRecipeLine(line._key, 'quantity', e.target.value)}
                            placeholder="Qty"
                            type="number"
                            step="any"
                            min="0.0001"
                            className="h-8.5 text-[11px] font-mono text-center"
                            required
                          />
                        </div>

                        {/* Unit string block */}
                        <div className="w-15 text-left shrink-0 text-[10px] font-mono font-bold text-muted-foreground select-none uppercase">
                          {line.unit}
                        </div>

                        {/* Remove Line */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipeLine(line._key)}
                          className="size-8.5 text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {modalFeedback && <FeedbackBanner feedback={modalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={submitting}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE PRODUCT CONFIRMATION MODAL ────────────────────── */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
              </h2>
              <button
                onClick={() => setDeletingProduct(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-card-foreground">
                Are you absolutely sure you want to permanently delete the product <span className="font-bold text-foreground">"{deletingProduct.name}"</span>?
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL WARNING:</strong> This action is irreversible. The product record and its registered recipe ingredients links will be permanently deleted from active sales points.
                </span>
              </div>
            </div>

            {modalFeedback && (
              <div className="mt-4">
                <FeedbackBanner feedback={modalFeedback} />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingProduct(null)}
                disabled={submitting}
                className="h-9 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={submitting}
                variant="destructive"
                className="h-9 px-4 text-xs font-semibold"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <LoaderCircle className="size-3.5 animate-spin" /> Deleting…
                  </span>
                ) : (
                  'Delete Product'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
