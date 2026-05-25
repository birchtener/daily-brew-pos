import { useEffect, useState, useCallback } from "react";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  type Discount,
} from "@/api/discounts";
import { fetchUsers, type UpdatedUser } from "@/api/users";
import { useStore } from "@/store/useStore";
import { extractErrorMessage } from "@/lib/extractErrorMessage";

import DiscountsHeader from "../components/discounts/DiscountsHeader";
import DiscountsFeedbackBanner from "../components/discounts/DiscountsFeedbackBanner";
import DiscountsToolbar from "../components/discounts/DiscountsToolbar";
import DiscountsGrid from "../components/discounts/DiscountsGrid";
import CreateDiscountDialog from "../components/discounts/CreateDiscountDialog";
import EditDiscountDialog from "../components/discounts/EditDiscountDialog";
import DeleteDiscountDialog from "../components/discounts/DeleteDiscountDialog";
import type { FeedbackState } from "../components/discounts/types";

export default function DiscountsPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === "admin";

  // ── STATE ──
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [users, setUsers] = useState<UpdatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Form Inputs
  const [searchVal, setSearchVal] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formPercentage, setFormPercentage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Modals / Editing States
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(
    null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [modalFeedback, setModalFeedback] = useState<FeedbackState>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const discountData = await getDiscounts();
      setDiscounts(discountData);

      try {
        const userData = await fetchUsers({ page: 1, perPage: 100 });
        setUsers(userData.items);
      } catch {
        setUsers([]);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to fetch active discounts."));
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
      setFeedback({
        type: "error",
        message: "Percentage must be a positive integer between 1 and 100.",
      });
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
      setFormCode("");
      setFormName("");
      setFormPercentage("");
      setIsCreateModalOpen(false);
      setFeedback({
        type: "success",
        message: "Promo discount code registered successfully!",
      });
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: extractErrorMessage(err, "Failed to register discount code."),
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
      setModalFeedback({
        type: "error",
        message: "Percentage must be a positive integer between 1 and 100.",
      });
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
      setFeedback({
        type: "success",
        message: "Discount properties successfully updated.",
      });
      await fetchData();
    } catch (err: any) {
      setModalFeedback({
        type: "error",
        message: extractErrorMessage(err, "Failed to update discount details."),
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
      setFeedback({
        type: "success",
        message: "Discount code permanently dropped.",
      });
      setDeletingDiscount(null);
      await fetchData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: extractErrorMessage(err, "Failed to delete discount."),
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
      d.name.toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <DiscountsHeader />

      {feedback && <DiscountsFeedbackBanner feedback={feedback} />}

      <div className="flex flex-col gap-4">
        <DiscountsToolbar
          isAdmin={isAdmin}
          searchVal={searchVal}
          filteredCount={filteredDiscounts.length}
          totalCount={discounts.length}
          onSearchChange={setSearchVal}
          onCreateClick={() => {
            setFormCode("");
            setFormName("");
            setFormPercentage("");
            setIsCreateModalOpen(true);
            setFeedback(null);
          }}
        />

        <DiscountsGrid
          discounts={filteredDiscounts}
          users={users}
          loading={loading}
          error={error}
          totalCount={discounts.length}
          isAdmin={isAdmin}
          onRetry={fetchData}
          onEditStart={handleOpenEditModal}
          onDeleteStart={(d) => {
            setDeletingDiscount(d);
            setFeedback(null);
          }}
        />
      </div>

      <CreateDiscountDialog
        open={isCreateModalOpen}
        formCode={formCode}
        formName={formName}
        formPercentage={formPercentage}
        submitting={submitting}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormCode("");
          setFormName("");
          setFormPercentage("");
        }}
        onFormCodeChange={setFormCode}
        onFormNameChange={setFormName}
        onFormPercentageChange={setFormPercentage}
        onSubmit={handleAddDiscount}
      />

      <EditDiscountDialog
        open={!!editingDiscount}
        discount={editingDiscount}
        formCode={formCode}
        formName={formName}
        formPercentage={formPercentage}
        submitting={submitting}
        modalFeedback={modalFeedback}
        onClose={() => {
          setEditingDiscount(null);
          setFormCode("");
          setFormName("");
          setFormPercentage("");
        }}
        onFormCodeChange={setFormCode}
        onFormNameChange={setFormName}
        onFormPercentageChange={setFormPercentage}
        onSubmit={handleEditSubmit}
      />

      <DeleteDiscountDialog
        open={!!deletingDiscount}
        discount={deletingDiscount}
        submitting={submitting}
        onClose={() => setDeletingDiscount(null)}
        onConfirm={() => deletingDiscount && handleDeleteDiscount(deletingDiscount.id)}
      />
    </div>
  );
}

