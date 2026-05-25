import { ShoppingCart, Trash2, Minus, Plus, Ticket, CreditCard, Wallet, Banknote, LoaderCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/api/products';

type CartItem = { product: Product; quantity: number };

interface Props {
  cartItems: CartItem[];
  clearCart: () => void;
  editingParkedOrder: any | null;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  discountCode: string;
  setDiscountCode: (v: string) => void;
  estimatedDiscount: number;
  selectedPayment: string;
  setSelectedPayment: (v: string) => void;
  subTotal: number;
  discountAmount: number;
  total: number;
  handleCheckoutSubmit: (park?: boolean) => Promise<void> | void;
  submitting: boolean;
  className?: string;
}

export default function CartPanel({
  cartItems,
  clearCart,
  editingParkedOrder,
  removeFromCart,
  updateQuantity,
  discountCode,
  setDiscountCode,
  estimatedDiscount,
  selectedPayment,
  setSelectedPayment,
  subTotal,
  discountAmount,
  total,
  handleCheckoutSubmit,
  submitting,
  className,
}: Props) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm p-4 flex flex-col gap-4 sticky top-6", className)}>
      <div className="flex items-center justify-between border-b border-border pb-3 mb-1">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="size-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Checkout cart</h3>
          {cartItems.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-muted rounded-full text-card-foreground">
              {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
            </span>
          )}
        </div>

        {cartItems.length > 0 && (
          <button onClick={clearCart} className="text-[10px] font-semibold text-destructive hover:text-destructive/80 transition flex items-center gap-1">
            <Trash2 className="size-3" /> Clear
          </button>
        )}
      </div>

      {editingParkedOrder && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 flex items-center justify-between text-xs text-primary animate-in slide-in-from-top-1">
          <div className="min-w-0">
            <p className="font-semibold truncate">Editing Parked Order</p>
            <p className="text-[10px] font-mono text-primary/70 mt-0.5 truncate">{editingParkedOrder.id}</p>
          </div>
          <button onClick={clearCart} className="size-5 rounded hover:bg-primary/20 flex items-center justify-center shrink-0"><X className="size-3.5" /></button>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 select-none">
          <ShoppingCart className="size-12 stroke-[1.25] text-muted-foreground/35 animate-pulse" />
          <div>
            <p className="font-semibold text-foreground text-sm">Station cart empty</p>
            <p className="text-[11px] max-w-50 mx-auto mt-1 leading-normal">Select active classic beverages from the left catalog grid to construct checkout lines.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-55 overflow-y-auto pr-1">
          {cartItems.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between gap-3 p-2 bg-muted/40 rounded-xl border border-border/40 animate-in fade-in">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-foreground truncate">{item.product.name}</p>
                <p className="font-mono text-[10px] text-primary/80 font-bold mt-0.5">₱{Number(item.product.price).toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQuantity(item.product.id, -1)} className="size-6.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition"><Minus className="size-3" /></button>
                <span className="font-mono text-xs font-bold text-foreground w-6 text-center select-none">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, 1)} className="size-6.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition"><Plus className="size-3" /></button>
                <button onClick={() => removeFromCart(item.product.id)} className="size-6.5 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition ml-1"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <>
          <div className="flex items-center gap-2 border-t border-border pt-4 mt-1">
            <div className="relative flex-1">
              <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Enter Coupon (e.g., SUMMER20)" className="pl-8.5 h-8.5 text-xs font-mono uppercase" />
            </div>
            {estimatedDiscount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">-{estimatedDiscount}%</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-1 border-t border-border pt-4">
            <label className="text-[11px] font-semibold text-card-foreground">Choose Payment Type</label>
            <div className="grid grid-cols-4 gap-2 select-none">
              <button type="button" onClick={() => setSelectedPayment('cash')} className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${selectedPayment === 'cash' ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                <Banknote className="size-4 shrink-0" />
                <span className="text-[9px] font-semibold">Cash</span>
              </button>

              <button type="button" onClick={() => setSelectedPayment('card')} className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${selectedPayment === 'card' ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                <CreditCard className="size-4 shrink-0" />
                <span className="text-[9px] font-semibold">Card</span>
              </button>

              <button type="button" onClick={() => setSelectedPayment('gcash')} className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${selectedPayment === 'gcash' ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                <Wallet className="size-4 shrink-0" />
                <span className="text-[9px] font-semibold">GCash</span>
              </button>

              <button type="button" onClick={() => setSelectedPayment('maya')} className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${selectedPayment === 'maya' ? 'border-emerald-600 bg-emerald-600/5 text-emerald-600 dark:text-emerald-500' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}>
                <Wallet className="size-4 shrink-0" />
                <span className="text-[9px] font-semibold">Maya</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border/40 pt-4 mt-1 bg-muted/20 rounded-xl p-3 font-mono">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Subtotal</span>
              <span>₱{subTotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount Coupon</span>
                <span>-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs font-bold text-foreground border-t border-border/60 pt-1.5 mt-0.5">
              <span>Total Amount</span>
              <span className="text-primary text-sm">₱{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 select-none">
            <Button onClick={() => handleCheckoutSubmit(false)} disabled={submitting} className="w-full h-10 text-xs font-bold shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground shadow">
              {submitting ? (<span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Processing…</span>) : (editingParkedOrder ? 'Finalize Settlement' : 'Checkout')}
            </Button>

            {!editingParkedOrder && (
              <Button onClick={() => handleCheckoutSubmit(true)} disabled={submitting} variant="outline" className="w-full h-10 text-xs font-semibold shrink-0 border-primary/20 text-primary hover:bg-primary/5 shadow-none">
                {submitting ? (<span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Parking…</span>) : 'Park Order'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
