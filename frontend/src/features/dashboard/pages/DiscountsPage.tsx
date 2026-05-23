import { useEffect, useState, useCallback } from 'react';
import {
  Percent,
  Plus,
  Search,
  Edit3,
  Trash2,
  LoaderCircle,
  AlertCircle,
  Check,
  X,
  Ticket,
} from 'lucide-react';
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  type Discount,
} from '@/api/discounts';
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

export default function DiscountsPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  // ── STATE ──
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Form Inputs
  const [searchVal, setSearchVal] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formPercentage, setFormPercentage] = useState('');

  // Modals / Editing States
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [modalFeedback, setModalFeedback] = useState<FeedbackState>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiscounts();
      setDiscounts(data);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to fetch active discounts.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim() || !formPercentage) return;
    const pct = parseInt(formPercentage);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setFeedback({ type: 'error', message: 'Percentage must be a positive integer between 1 and 100.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await createDiscount({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        percentage: pct,
      });
      setFormCode('');
      setFormName('');
      setFormPercentage('');
      setFeedback({ type: 'success', message: 'Promo discount code registered successfully!' });
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to register discount code.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setFormCode(d.code);
    setFormName(d.name);
    setFormPercentage(String(d.percentage));
    setModalFeedback(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscount) return;
    if (!formCode.trim() || !formName.trim() || !formPercentage) return;
    const pct = parseInt(formPercentage);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setModalFeedback({ type: 'error', message: 'Percentage must be a positive integer between 1 and 100.' });
      return;
    }

    setSubmitting(true);
    setModalFeedback(null);
    try {
      await updateDiscount(editingDiscount.id, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        percentage: pct,
      });
      setEditingDiscount(null);
      setFeedback({ type: 'success', message: 'Discount properties successfully updated.' });
      await fetchData();
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to update discount details.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    setSubmitting(true);
    setFeedback(null);
    try {
      await deleteDiscount(id);
      setFeedback({ type: 'success', message: 'Discount code permanently dropped.' });
      setDeletingDiscount(null);
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to delete discount.'),
      });
      setDeletingDiscount(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Local Filter
  const filteredDiscounts = discounts.filter(
    (d) =>
      d.code.toLowerCase().includes(searchVal.toLowerCase()) ||
      d.name.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      {/* Header section */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Percent className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Discounts Catalog</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Register promotional checkout codes, set campaign percentages, and configure billing rules.
        </p>
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Add Discount Code Form */}
        {isAdmin && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-1">Establish Discount Code</h2>
              <p className="text-[11px] text-muted-foreground">
                Create a promo code with a custom percentage deductions structure.
              </p>
            </div>

            <form onSubmit={handleAddDiscount} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Promo Code</label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g., DAILYBREW20"
                  className="h-10 text-sm font-mono uppercase"
                  maxLength={50}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Campaign Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Anniversary Promo"
                  className="h-10 text-sm"
                  maxLength={50}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Deduction Percentage (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formPercentage}
                  onChange={(e) => setFormPercentage(e.target.value)}
                  placeholder="e.g., 20"
                  className="h-10 text-sm font-mono"
                  disabled={submitting}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !formCode.trim() || !formName.trim() || !formPercentage}
                className="w-full h-9.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" /> Add Discount
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Right Area: Discounts list and search */}
        <div className={`flex flex-col gap-4 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {/* Toolbar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search promo codes or descriptions..."
                className="pl-9 w-full h-9 text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground shrink-0 select-none">
              Showing <span className="font-semibold text-card-foreground">{filteredDiscounts.length}</span> of {discounts.length} promo codes
            </div>
          </div>

          {/* Grid Layout of Discounts */}
          {loading && discounts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-card h-32 p-4 flex flex-col justify-between" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500 border border-border bg-card rounded-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="size-8 animate-bounce" />
                <p className="font-semibold">Failed to load discounts catalog</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl">
              <div className="flex flex-col items-center justify-center gap-3">
                <Ticket className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-foreground">No promo codes found</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                    {discounts.length === 0 ? 'Create your first discount code to start applying discounts in the terminal!' : 'Try modifying your search query.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDiscounts.map((d) => {
                return (
                  <div
                    key={d.id}
                    className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col justify-between h-32"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono font-black text-foreground text-base tracking-wider truncate" title={d.code}>
                            {d.code}
                          </h3>
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400 select-none">
                            {d.percentage}% OFF
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1.5 truncate" title={d.name}>
                          {d.name}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 select-none shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                            title="Configure promo discount"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingDiscount(d);
                              setFeedback(null);
                            }}
                            className="size-7 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-rose-500 transition"
                            title="Remove promo code"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground flex justify-between items-center border-t border-border/40 pt-2 font-mono">
                      <span>Updated: {new Date(d.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT DISCOUNT MODAL ────────────────────────────────────── */}
      {editingDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="size-5 text-primary" /> Configure Promo Discount
              </h2>
              <button
                onClick={() => setEditingDiscount(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Promo Code</label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-10 text-sm font-mono uppercase"
                  maxLength={50}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Campaign Name</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 text-sm"
                  maxLength={50}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-card-foreground uppercase">Deduction Percentage (%)</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formPercentage}
                  onChange={(e) => setFormPercentage(e.target.value)}
                  className="h-10 text-sm font-mono"
                  disabled={submitting}
                  required
                />
              </div>

              {modalFeedback && <FeedbackBanner feedback={modalFeedback} />}

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDiscount(null)}
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
                  {submitting ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────── */}
      {deletingDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
                <Trash2 className="size-5 shrink-0" /> Confirm Permanent Deletion
              </h2>
              <button
                onClick={() => setDeletingDiscount(null)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1 text-left">
              <p className="text-sm text-card-foreground">
                Are you absolutely sure you want to permanently delete the promo code <span className="font-mono font-bold text-foreground">"{deletingDiscount.code}"</span>?
              </p>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL WARNING:</strong> This action is permanent. If this promo code has already been applied to any parked or completed order logs, the database will block the deletion to preserve order records. Otherwise, it will be dropped immediately.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingDiscount(null)}
                disabled={submitting}
                className="h-9 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteDiscount(deletingDiscount.id)}
                disabled={submitting}
                variant="destructive"
                className="h-9 px-4 text-xs font-semibold"
              >
                {submitting ? 'Deleting…' : 'Delete Promo Code'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
