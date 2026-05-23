import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  User, 
  Phone, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  LoaderCircle, 
  AlertCircle, 
  Check, 
  X,
  Calendar
} from 'lucide-react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  type Supplier 
} from '@/api/suppliers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type FeedbackState = { type: "success" | "error"; message: string } | null;

function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const isError = feedback.type === "error";
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
        isError
          ? "border border-destructive/20 bg-destructive/10 text-destructive"
          : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {isError ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
      {feedback.message}
    </div>
  );
}

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
  const [modalFeedback, setModalFeedback] = useState<FeedbackState>(null);

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
    setModalFeedback(null);
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
    setModalFeedback(null);
    setSubmitting(false);
  };

  // Handle create
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalFeedback({ type: 'error', message: 'Supplier/Company name is required.' });
      return;
    }

    setSubmitting(true);
    setModalFeedback(null);

    try {
      await createSupplier({
        name: formName.trim(),
        contact_name: formContactName.trim() || undefined,
        contact_number: formContactNumber.trim() || undefined,
      });
      setIsAddModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to add supplier.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (!formName.trim()) {
      setModalFeedback({ type: 'error', message: 'Supplier/Company name is required.' });
      return;
    }

    setSubmitting(true);
    setModalFeedback(null);

    try {
      await updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        contact_name: formContactName.trim() || undefined,
        contact_number: formContactNumber.trim() || undefined,
      });
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to update supplier details.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteSubmit = async () => {
    if (!deletingSupplier) return;
    setSubmitting(true);
    setModalFeedback(null);

    try {
      await deleteSupplier(deletingSupplier.id);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to delete supplier.'),
      });
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
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Suppliers Registry</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage vendor details, coordinate supplier contacts, and inspect procurement relations.
          </p>
        </div>

        <Button 
          onClick={handleOpenAddModal} 
          className="h-9 px-4 text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="size-4" /> Add Supplier
        </Button>
      </div>

      {/* Control panel & Search */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search suppliers by company or contact name..."
            className="pl-9 w-full h-9 text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground select-none">
          Showing <span className="font-semibold text-card-foreground">{filteredSuppliers.length}</span> of {suppliers.length} vendors
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden select-text">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground select-none">
                <th className="p-4 w-[250px] md:w-[320px]">Vendor Name</th>
                <th className="p-4 w-[200px] md:w-[260px]">Contact Person</th>
                <th className="p-4 w-[180px] md:w-[220px]">Phone Number</th>
                <th className="p-4 w-[150px] hidden lg:table-cell">Last Updated</th>
                <th className="p-4 w-[60px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && suppliers.length === 0 ? (
                // Skeleton UI Loader
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-muted shrink-0" />
                        <div className="h-4 bg-muted rounded w-36" />
                      </div>
                    </td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
                    <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="p-4 text-center"><div className="size-6 bg-muted rounded mx-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error state banner
                <tr>
                  <td colSpan={5} className="p-8 text-center text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="size-8 animate-bounce" />
                      <p className="font-semibold">Failed to load suppliers list</p>
                      <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
                      <Button variant="outline" size="sm" onClick={fetchSuppliers} className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Building2 className="size-10 text-muted-foreground/30" />
                      <div>
                        <p className="font-medium text-foreground">No suppliers found</p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                          Try adjusting search terms or register a new vendor.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Row mapping
                filteredSuppliers.map((supplier) => {
                  const updatedAt = new Date(supplier.updated_at);

                  return (
                    <tr 
                      key={supplier.id} 
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
                      {/* Vendor Name */}
                      <td className="p-4 font-semibold text-card-foreground">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                            <Building2 className="size-4.5" />
                          </div>
                          <span className="truncate">{supplier.name}</span>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="p-4 text-muted-foreground">
                        {supplier.contact_name ? (
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <User className="size-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{supplier.contact_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs italic select-none">Not Specified</span>
                        )}
                      </td>

                      {/* Contact Phone */}
                      <td className="p-4 text-muted-foreground text-left">
                        {supplier.contact_number ? (
                          <a 
                            href={`tel:${supplier.contact_number}`}
                            className="flex items-center gap-2 hover:text-primary transition font-mono whitespace-nowrap text-xs md:text-sm font-medium"
                          >
                            <Phone className="size-4 text-muted-foreground shrink-0" />
                            <span>{supplier.contact_number}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs italic select-none">Not Specified</span>
                        )}
                      </td>

                      {/* Date Stamp */}
                      <td className="p-4 hidden lg:table-cell text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          <span>{updatedAt.toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Context Menu Action Button Trigger (placed inside valid td) */}
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
                            <ContextMenuItem 
                              onSelect={() => handleOpenEditModal(supplier)}
                              className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
                            >
                              <Edit3 className="size-3.5 text-muted-foreground" />
                              Edit Details
                            </ContextMenuItem>
                            {isAdmin && (
                              <ContextMenuItem 
                                onSelect={() => {
                                  setDeletingSupplier(supplier);
                                  setModalFeedback(null);
                                }}
                                className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                                Delete Supplier
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

      {/* ── ADD SUPPLIER MODAL ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="size-5 text-primary" /> Register New Supplier
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Supplier / Company Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Mountain Brew Distributors"
                  className="h-10 text-sm"
                  maxLength={100}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Contact Person Name
                </label>
                <Input
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="h-10 text-sm"
                  maxLength={50}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Contact Phone Number
                </label>
                <Input
                  value={formContactNumber}
                  onChange={(e) => setFormContactNumber(e.target.value)}
                  placeholder="e.g., +639123456789"
                  className="h-10 text-sm font-mono"
                  maxLength={15}
                />
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
                  disabled={submitting}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                    </span>
                  ) : (
                    "Add Supplier"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT SUPPLIER MODAL ───────────────────────────────────── */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Edit Supplier Details
              </h2>
              <button 
                onClick={() => setEditingSupplier(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Supplier / Company Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Company Name"
                  className="h-10 text-sm"
                  maxLength={100}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Contact Person Name
                </label>
                <Input
                  value={formContactName}
                  onChange={(e) => setFormContactName(e.target.value)}
                  placeholder="Contact Person Name"
                  className="h-10 text-sm"
                  maxLength={50}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-card-foreground">
                  Contact Phone Number
                </label>
                <Input
                  value={formContactNumber}
                  onChange={(e) => setFormContactNumber(e.target.value)}
                  placeholder="Phone number"
                  className="h-10 text-sm font-mono"
                  maxLength={15}
                />
              </div>

              {modalFeedback && <FeedbackBanner feedback={modalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSupplier(null)}
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
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE SUPPLIER CONFIRMATION MODAL ────────────────────── */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
              </h2>
              <button 
                onClick={() => setDeletingSupplier(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <p className="text-sm text-card-foreground">
                Are you absolutely sure you want to permanently delete the vendor <span className="font-bold text-foreground">"{deletingSupplier.name}"</span>?
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL WARNING:</strong> This action is irreversible. The supplier record will be removed from all active database charts. Deletion will fail if purchase orders are linked to this supplier.
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
                onClick={() => setDeletingSupplier(null)}
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
                  "Delete Vendor"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
