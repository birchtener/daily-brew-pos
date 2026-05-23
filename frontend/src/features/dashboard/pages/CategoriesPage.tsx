import { useEffect, useState, useCallback, type FormEvent } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/api/categories';
import { getProducts, type Product } from '@/api/products';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import CategoriesHeader from '../components/categories/CategoriesHeader';
import CategoriesFeedbackBanner from '../components/categories/CategoriesFeedbackBanner';
import CategoriesToolbar from '../components/categories/CategoriesToolbar';
import CategoriesGrid from '../components/categories/CategoriesGrid';
import DeleteCategoryDialog from '../components/categories/DeleteCategoryDialog';
import CreateCategoryDialog from '../components/categories/CreateCategoryDialog';
import type { FeedbackState } from '../components/categories/types';

export default function CategoriesPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchVal, setSearchVal] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createCategory({ name: newCatName.trim() });
      setNewCatName('');
      setIsCreateDialogOpen(false);
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

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <CategoriesHeader />

      {feedback && <CategoriesFeedbackBanner feedback={feedback} />}

      <CategoriesToolbar
        isAdmin={isAdmin}
        searchVal={searchVal}
        filteredCount={filteredCategories.length}
        totalCount={categories.length}
        onSearchChange={setSearchVal}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      <CategoriesGrid
        categories={filteredCategories}
        products={products}
        loading={loading}
        error={error}
        totalCount={categories.length}
        isAdmin={isAdmin}
        editingCatId={editingCatId}
        editingCatName={editingCatName}
        submitting={submitting}
        onRetry={fetchData}
        onEditStart={(category) => {
          setEditingCatId(category.id);
          setEditingCatName(category.name);
          setFeedback(null);
        }}
        onEditCancel={() => {
          setEditingCatId(null);
          setEditingCatName('');
        }}
        onEditNameChange={setEditingCatName}
        onEditSave={handleUpdateCategory}
        onDeleteStart={(category) => {
          setDeletingCategory(category);
          setFeedback(null);
        }}
      />

      <CreateCategoryDialog
        open={isCreateDialogOpen}
        newCatName={newCatName}
        submitting={submitting}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setNewCatName('');
        }}
        onNewCatNameChange={setNewCatName}
        onSubmit={handleAddCategory}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        productCount={deletingCategory ? products.filter((product) => product.category_id === deletingCategory.id).length : 0}
        submitting={submitting}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
