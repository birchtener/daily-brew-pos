import { useEffect, useState, useCallback } from 'react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  type Supplier 
} from '@/api/suppliers';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { toast } from 'sonner';

import SuppliersHeader from '../components/suppliers/SuppliersHeader';
import SuppliersToolbar from '../components/suppliers/SuppliersToolbar';
import SuppliersTable from '../components/suppliers/SuppliersTable';
import SuppliersMobileList from '../components/suppliers/SuppliersMobileList';
import CreateSupplierDialog from '../components/suppliers/CreateSupplierDialog';
import EditSupplierDialog from '../components/suppliers/EditSupplierDialog';
import DeleteSupplierDialog from '../components/suppliers/DeleteSupplierDialog';

export default function SuppliersPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchVal, setSearchVal] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debouncing search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchVal);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Reset form states
  const resetForm = () => {
    setFormName('');
    setFormContactName('');
    setFormContactNumber('');
    setSubmitting(false);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContactName(supplier.contact_name || '');
    setFormContactNumber(supplier.contact_number || '');
    setSubmitting(false);
  };

  // Handle create
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Supplier/Company name is required.');
      return;
    }

    setSubmitting(true);

    try {
      await createSupplier({
        name: formName.trim(),
        contact_name: formContactName.trim() || undefined,
        contact_number: formContactNumber.trim() || undefined,
      });
      setIsAddModalOpen(false);
      fetchSuppliers();
      toast.success('Supplier added successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add supplier.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (!formName.trim()) {
      toast.error('Supplier/Company name is required.');
      return;
    }

    setSubmitting(true);

    try {
      await updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        contact_name: formContactName.trim() || undefined,
        contact_number: formContactNumber.trim() || undefined,
      });
      setEditingSupplier(null);
      fetchSuppliers();
      toast.success('Supplier updated successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update supplier details.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteSubmit = async () => {
    if (!deletingSupplier) return;
    setSubmitting(true);

    try {
      await deleteSupplier(deletingSupplier.id);
      setDeletingSupplier(null);
      fetchSuppliers();
      toast.success('Supplier deleted successfully!');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete supplier.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Local filter matching search bar
  const filteredSuppliers = suppliers.filter((s) => {
    const query = searchDebounced.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      (s.contact_name || '').toLowerCase().includes(query) ||
      (s.contact_number || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <SuppliersHeader
        isAdmin={isAdmin}
        onAddClick={handleOpenAddModal}
      />

      <SuppliersToolbar
        searchVal={searchVal}
        onSearchChange={setSearchVal}
        filteredCount={filteredSuppliers.length}
        totalCount={suppliers.length}
      />

      <SuppliersTable
        suppliers={filteredSuppliers}
        totalCount={suppliers.length}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        onEdit={handleOpenEditModal}
        onDelete={(supplier) => {
          setDeletingSupplier(supplier);
        }}
        onRetry={fetchSuppliers}
      />

      <SuppliersMobileList
        suppliers={filteredSuppliers}
        totalCount={suppliers.length}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        onEdit={handleOpenEditModal}
        onDelete={(supplier) => {
          setDeletingSupplier(supplier);
        }}
      />

      <CreateSupplierDialog
        open={isAddModalOpen}
        formName={formName}
        formContactName={formContactName}
        formContactNumber={formContactNumber}
        submitting={submitting}
        onClose={() => setIsAddModalOpen(false)}
        onFormNameChange={setFormName}
        onFormContactNameChange={setFormContactName}
        onFormContactNumberChange={setFormContactNumber}
        onSubmit={handleAddSubmit}
      />

      <EditSupplierDialog
        open={!!editingSupplier}
        supplier={editingSupplier}
        formName={formName}
        formContactName={formContactName}
        formContactNumber={formContactNumber}
        submitting={submitting}
        onClose={() => setEditingSupplier(null)}
        onFormNameChange={setFormName}
        onFormContactNameChange={setFormContactName}
        onFormContactNumberChange={setFormContactNumber}
        onSubmit={handleEditSubmit}
      />

      <DeleteSupplierDialog
        open={!!deletingSupplier}
        supplier={deletingSupplier}
        submitting={submitting}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleDeleteSubmit}
      />
    </div>
  );
}
