import { useEffect, useState, useCallback, useRef } from 'react';
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
} from '@/api/ingredients';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { toast } from 'sonner';

import ProductsHeader from '../components/products/ProductsHeader';
import ProductsToolbar from '../components/products/ProductsToolbar';
import ProductsGrid from '../components/products/ProductsGrid';
import CreateProductDialog from '../components/products/CreateProductDialog';
import EditProductDialog from '../components/products/EditProductDialog';
import DeleteProductDialog from '../components/products/DeleteProductDialog';
import type { RecipeLine } from '../components/products/types';

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
  const [formRecipeLines, setFormRecipeLines] = useState<RecipeLine[]>([]);

  const [submitting, setSubmitting] = useState(false);
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
      toast.error('Product name is required.');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please specify a positive price.');
      return;
    }
    if (!formCategoryId) {
      toast.error('Category selection is required.');
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
      toast.success('Product created successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to register product.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formName.trim()) {
      toast.error('Product name is required.');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please specify a positive price.');
      return;
    }
    if (!formCategoryId) {
      toast.error('Category selection is required.');
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
      toast.success('Product updated successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update product details.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingProduct) return;
    setSubmitting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      fetchData();
      toast.success('Product deleted successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete product.'));
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
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <ProductsHeader
        isAdmin={isAdmin}
        onAddClick={handleOpenAddModal}
      />

      <ProductsToolbar
        searchVal={searchVal}
        onSearchChange={setSearchVal}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

      <ProductsGrid
        products={filteredProducts}
        totalCount={products.length}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        expandedProducts={expandedProducts}
        onToggleExpand={toggleExpanded}
        onEdit={handleOpenEditModal}
        onDelete={(prod) => {
          setDeletingProduct(prod);
        }}
        onRetry={fetchData}
      />

      <CreateProductDialog
        open={isAddModalOpen}
        categories={categories}
        ingredients={ingredients}
        formName={formName}
        formPrice={formPrice}
        formCategoryId={formCategoryId}
        formImagePreview={formImagePreview}
        formRecipeLines={formRecipeLines}
        submitting={submitting}
        fileInputRef={fileInputRef}
        onClose={() => setIsAddModalOpen(false)}
        onFormNameChange={setFormName}
        onFormPriceChange={setFormPrice}
        onFormCategoryIdChange={setFormCategoryId}
        onImageChange={handleImageChange}
        onClearImage={clearImage}
        onAddRecipeLine={addRecipeLine}
        onRemoveRecipeLine={removeRecipeLine}
        onUpdateRecipeLine={updateRecipeLine}
        onSubmit={handleAddSubmit}
      />

      <EditProductDialog
        open={!!editingProduct}
        product={editingProduct}
        categories={categories}
        ingredients={ingredients}
        formName={formName}
        formPrice={formPrice}
        formCategoryId={formCategoryId}
        formImagePreview={formImagePreview}
        formRecipeLines={formRecipeLines}
        submitting={submitting}
        fileInputRef={fileInputRef}
        onClose={() => setEditingProduct(null)}
        onFormNameChange={setFormName}
        onFormPriceChange={setFormPrice}
        onFormCategoryIdChange={setFormCategoryId}
        onImageChange={handleImageChange}
        onClearImage={clearImage}
        onAddRecipeLine={addRecipeLine}
        onRemoveRecipeLine={removeRecipeLine}
        onUpdateRecipeLine={updateRecipeLine}
        onSubmit={handleEditSubmit}
      />

      <DeleteProductDialog
        open={!!deletingProduct}
        product={deletingProduct}
        submitting={submitting}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteSubmit}
      />
    </div>
  );
}
