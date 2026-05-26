import { useState } from "react";
import { voidOrder } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle } from "lucide-react";
import ConfirmationDialog from "./ConfirmationDialog";
import { toast } from "sonner";

interface Props {
  completedOrders: any[];
  fetchData: () => void;
}

export default function CompletedList({ completedOrders, fetchData }: Props) {
  const [orderToVoid, setOrderToVoid] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      {completedOrders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none py-16">
          <CheckCircle className="size-12 stroke-[1.25] text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              No completed orders found
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              Once orders are settled and fully completed, their payment receipt
              history lists will trace here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedOrders.map((order) => {
            const date = new Date(order.created_at);
            const paymentMethod = (
              order.payment?.method || "cash"
            ).toLowerCase();

            let paymentStyle =
              "bg-zinc-500/15 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"; // Default Cash (Gray)
            if (paymentMethod === "card")
              paymentStyle =
                "bg-red-500/15 border-red-500/20 text-red-600 dark:text-red-400"; // Red
            if (paymentMethod === "gcash")
              paymentStyle =
                "bg-blue-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400"; // Blue
            if (paymentMethod === "maya" || paymentMethod === "paymaya")
              paymentStyle =
                "bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"; // Green

            let paymentDisplayName = paymentMethod.toUpperCase();
            if (paymentMethod === "maya" || paymentMethod === "paymaya")
              paymentDisplayName = "PAYMAYA";
            if (paymentMethod === "gcash") paymentDisplayName = "GCASH";

            return (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between gap-4 select-text"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2 mb-2">
                    <div className="min-w-0">
                      <p
                        className="text-xs font-bold text-foreground font-mono truncate"
                        title={order.id}
                      >
                        Order #{order.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono select-none">
                        {date.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 select-none">
                        Settled
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full ${paymentStyle} border px-2 py-0.5 text-[9px] font-bold select-none`}
                      >
                        {paymentDisplayName}
                      </span>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2 max-h-25 overflow-y-auto pr-1">
                      {order.items.map((line: any) => (
                        <div
                          key={line.id}
                          className="flex justify-between items-center text-[10px] text-muted-foreground"
                        >
                          <span className="truncate max-w-40">
                            • {line.product?.name || "Beverage Item"}
                          </span>
                          <span className="font-mono font-semibold">
                            Qty: {line.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3 mt-2">
                  <div className="text-left font-mono">
                    <p className="text-[10px] text-muted-foreground leading-none">
                      Total Value
                    </p>
                    <p className="text-xs font-extrabold text-primary mt-1">
                      ₱{Number(order.total).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="h-8 px-3 text-[10px] font-bold shrink-0 border border-destructive/50"
                    onClick={() => setOrderToVoid(order)}
                  >
                    <Ban className="size-3" />
                    Void Order
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!orderToVoid}
        onClose={() => {
          setOrderToVoid(null);
          setVoidReason("");
        }}
        onConfirm={async () => {
          if (orderToVoid) {
            if (!voidReason.trim()) {
              toast.error("Please provide a void reason.");
              return;
            }

            setVoiding(true);
            try {
              await voidOrder(orderToVoid.id, voidReason.trim());
              setOrderToVoid(null);
              setVoidReason("");
              fetchData();
            } catch (err: any) {
              toast.error(
                err?.response?.data?.message ||
                  "Failed to void completed order.",
              );
            } finally {
              setVoiding(false);
            }
          }
        }}
        title="Void Completed Transaction"
        description={`Warning: You are about to void settled Order #${orderToVoid?.id.substring(0, 8).toUpperCase()}. This will reverse the transaction in sales history, restock the ingredients in FIFO order, and log a permanent void activity log. Do you want to proceed?`}
        confirmText="Void Transaction"
        confirmDisabled={voiding || !voidReason.trim()}
      >
        <div className="mt-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-card-foreground">
            Void Reason <span className="text-destructive">*</span>
          </label>
          <textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="e.g. customer changed mind after payment"
            className="w-full min-h-24 rounded-lg border border-border bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground select-text"
            maxLength={500}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
}
