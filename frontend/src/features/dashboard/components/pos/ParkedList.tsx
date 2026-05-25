 
import { Clock, ArrowLeftRight, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelParkedOrder } from '@/api/orders';
interface Props {
  parkedOrders: any[];
  loadParkedOrderForEditing: (order: any) => void;
  fetchData: () => void;
}

export default function ParkedList({ parkedOrders, loadParkedOrderForEditing, fetchData }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {parkedOrders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none py-16">
          <Clock className="size-12 stroke-[1.25] text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
          <div>
            <p className="font-semibold text-foreground text-sm">No parked orders found</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              Active parked order checkouts are temporarily cached here so cashiers can switch screens or edit them.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parkedOrders.map((order) => {
            const date = new Date(order.created_at);

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between gap-4 select-text">
                <div>
                  <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground font-mono truncate" title={order.id}>Order #{order.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono select-none">{date.toLocaleString()}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20 select-none">
                      <Clock className="size-2.5 shrink-0" /> Parked
                    </span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2 max-h-25 overflow-y-auto pr-1">
                      {order.items.map((line: any) => (
                        <div key={line.id} className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="truncate max-w-40">• {line.product?.name || 'Beverage Item'}</span>
                          <span className="font-mono font-semibold">Qty: {line.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3 mt-2">
                  <div className="text-left font-mono">
                    <p className="text-[10px] text-muted-foreground leading-none">Total Value</p>
                    <p className="text-xs font-extrabold text-primary mt-1">₱{Number(order.total).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" className="h-8 px-3 text-[10px] font-bold shrink-0 border border-destructive/50" onClick={async () => {
                      await cancelParkedOrder(order.id);
                      fetchData();
                    }}>
                      <Ban className="size-3" />
                      Cancel
                    </Button>
                    <Button onClick={() => loadParkedOrderForEditing(order)} className="h-8 px-3 text-[10px] font-bold shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 shadow-none inline-flex items-center gap-1">
                    <ArrowLeftRight className="size-3" /> Edit & Settle
                  </Button>
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
