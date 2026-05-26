import { Ban } from "lucide-react";

interface Props {
  cancelledOrders: any[];
  fetchData: () => void;
}

export default function CancelledList({ cancelledOrders }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {cancelledOrders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none py-16">
          <Ban className="size-12 stroke-[1.25] text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
          <div>
            <p className="font-semibold text-foreground text-sm">
              No cancelled orders found
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              Once orders are cancelled, their details will be listed here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cancelledOrders.map((order) => {
            const date = new Date(order.created_at);
            const paymentMethod = (
              order.payment?.method || "none"
            ).toLowerCase();

            let paymentStyle = "bg-muted border-border text-muted-foreground";
            if (paymentMethod === "cash")
              paymentStyle =
                "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400";
            if (paymentMethod === "card")
              paymentStyle =
                "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
            if (paymentMethod === "gcash")
              paymentStyle =
                "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
            if (paymentMethod === "maya" || paymentMethod === "paymaya")
              paymentStyle =
                "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";

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
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[9px] font-bold text-destructive select-none">
                        Cancelled
                      </span>
                      {paymentMethod !== "none" && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full ${paymentStyle} border px-2 py-0.5 text-[9px] font-bold select-none`}
                        >
                          {paymentDisplayName}
                        </span>
                      )}
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

                  {order.void_reason && (
                    <div className="mt-3 rounded-lg border border-destructive/15 bg-destructive/5 p-2 text-[10px] text-destructive/90 select-text">
                      <p className="font-semibold uppercase tracking-wide">
                        Void Reason
                      </p>
                      <p className="mt-1 leading-relaxed">
                        {order.void_reason}
                      </p>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
