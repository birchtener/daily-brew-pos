import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default" | "outline";
  confirmDisabled?: boolean;
  children?: ReactNode;
};

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  confirmDisabled = false,
  children,
}: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0 animate-pulse text-destructive" />{" "}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-2 text-sm text-muted-foreground leading-normal select-text">
          {description}
        </div>

        {children}

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant}
            disabled={confirmDisabled}
            className="h-9 px-4 text-xs font-semibold shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
