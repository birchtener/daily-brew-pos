import { useEffect, useState, useCallback } from 'react';
import {
  Coffee,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Ticket,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  LoaderCircle,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  checkout,
  getParkedOrders,
  getCompletedOrders,
  finalizeParkedOrder,
  type Order,
} from '@/api/orders';
import { getProducts, type Product } from '@/api/products';
import { getCategories, type Category } from '@/api/categories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { extractErrorMessage } from '@/lib/extractErrorMessage';

type CartItem = {
  product: Product;
  quantity: number;
};

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

export default function PosTerminalPage() {
  // ── POS TABS ──
  const [activeTab, setActiveTab] = useState<'terminal' | 'parked' | 'completed'>('terminal');

  // ── CORE DATA STATE ──
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parkedOrders, setParkedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── WORKSTATION STATE ──
  const [searchVal, setSearchVal] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');

  // Context editing a parked order
  const [editingParkedOrder, setEditingParkedOrder] = useState<Order | null>(null);

  // Actions states
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // ── DATA FETCHING ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, catsData, parkedData, completedData] = await Promise.all([
        getProducts(),
        getCategories(),
        getParkedOrders(),
        getCompletedOrders(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setParkedOrders(parkedData);
      setCompletedOrders(completedData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initialize POS Workstation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch parked & completed orders on tab switches
  useEffect(() => {
    if (activeTab === 'parked') {
      getParkedOrders().then(setParkedOrders).catch(() => {});
    } else if (activeTab === 'completed') {
      getCompletedOrders().then(setCompletedOrders).catch(() => {});
    }
  }, [activeTab]);

  // ── CART ACTIONS ──
  const addToCart = (product: Product) => {
    setFeedback(null);
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setFeedback(null);
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setFeedback(null);
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountCode('');
    setSelectedPayment('cash');
    setEditingParkedOrder(null);
    setFeedback(null);
  };

  // ── CALCULATIONS ──
  const subTotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  // Visual local mock discount percentage for immediate UI updates
  // Note: Backend calculates absolute totals securely using discount database rules
  let estimatedDiscount = 0;
  if (discountCode.trim().toUpperCase() === 'WELCOME10') estimatedDiscount = 10;
  if (discountCode.trim().toUpperCase() === 'SUMMER20') estimatedDiscount = 20;

  const discountAmount = (subTotal * estimatedDiscount) / 100;
  const total = subTotal - discountAmount;

  // ── PARKED ORDERS ACTIONS ──
  const loadParkedOrderForEditing = (order: Order) => {
    clearCart();
    setEditingParkedOrder(order);
    setDiscountCode(order.discount_code || '');

    // Map orderItems to cart items using loaded catalog details
    if (order.items) {
      const mapped: CartItem[] = [];
      order.items.forEach((item) => {
        const matchingProduct = products.find((p) => p.id === item.product_id);
        if (matchingProduct) {
          mapped.push({
            product: matchingProduct,
            quantity: item.quantity,
          });
        }
      });
      setCartItems(mapped);
    }
    setFeedback(null);
    setActiveTab('terminal'); // Switch back to active terminal
  };

  // ── SUBMIT HANDLERS ──

  // Direct checkout or re-parking
  const handleCheckoutSubmit = async (park = false) => {
    if (cartItems.length === 0) {
      setFeedback({ type: 'error', message: 'Cart is empty. Please add products.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const itemsPayload = cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    try {
      if (editingParkedOrder && !park) {
        // Finalize/settle an active parked order
        await finalizeParkedOrder(editingParkedOrder.id, {
          discount_code: discountCode.trim() || null,
          items: itemsPayload,
          payment_method: selectedPayment,
        });
        setFeedback({ type: 'success', message: 'Parked order successfully settled and completed!' });
      } else {
        // Standard fresh checkout (direct completion or parking)
        await checkout({
          discount_code: discountCode.trim() || null,
          items: itemsPayload,
          park,
          payment_method: park ? null : selectedPayment,
        });
        setFeedback({
          type: 'success',
          message: park
            ? 'Order successfully parked in pending cache!'
            : 'Order checkout successfully completed and settled!',
        });
      }

      // Refresh data
      const [parkedData, completedData, prodsData] = await Promise.all([
        getParkedOrders(),
        getCompletedOrders(),
        getProducts(), // Refresh product list to reflect stock deductions
      ]);
      setParkedOrders(parkedData);
      setCompletedOrders(completedData);
      setProducts(prodsData);
      clearCart();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'POS checkout processing failed.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── FILTERS ──
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal.toLowerCase()) || p.category.name.toLowerCase().includes(searchVal.toLowerCase());
    const matchesCat = categoryFilter === 'all-categories' || p.category_id === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-400 mx-auto select-none">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">POS Terminal</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Workstation for live beverage checkouts, pending parked orders, and quick payment settlements.
          </p>
        </div>

        {/* Premium Workstation Tab SELECTOR */}
        <div className="flex bg-muted/65 p-1 rounded-xl border border-border/40 w-fit shrink-0">
          <button
            onClick={() => { setActiveTab('terminal'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'terminal'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="size-3.5" /> Terminal
          </button>
          <button
            onClick={() => { setActiveTab('parked'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
              activeTab === 'parked'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="size-3.5" /> Parked
            {parkedOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                {parkedOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setFeedback(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="size-3.5" /> Completed
          </button>
        </div>
      </div>

      {feedback && <FeedbackBanner feedback={feedback} />}

      {error && (
        <div className="p-8 text-center text-rose-500 border border-border bg-card rounded-xl">
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertCircle className="size-8 animate-bounce" />
            <p className="font-semibold">Initialization Mismatch</p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
              Refresh Station
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════════ TERMINAL WORKSTATION ═══════════════ */}
      {activeTab === 'terminal' && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Product Selector Catalog (lg:col-span-7 xl:col-span-8) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Catalog Toolbar Filter & Search */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Filter beverages catalog..."
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Category pills list */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto items-center justify-start sm:justify-end overflow-x-auto select-none">
                <button
                  onClick={() => setCategoryFilter('all-categories')}
                  className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    categoryFilter === 'all-categories'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      categoryFilter === c.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Cards Grid */}
            {products.length === 0 && !loading ? (
              <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none">
                <Coffee className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-semibold text-foreground">No active products</p>
                <p className="text-xs">Create beverages catalog items under Inventory settings first.</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none">
                <Search className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-semibold">No matches found</p>
                <p className="text-xs">Try adjusting your search terms or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group flex flex-col justify-between text-left rounded-xl border border-border bg-card p-3 shadow-none hover:shadow hover:border-primary/50 transition-all duration-300 overflow-hidden h-[180px]"
                  >
                    {/* Header Image or fallback */}
                    <div className="relative h-20 w-full overflow-hidden bg-muted rounded-lg flex items-center justify-center shrink-0">
                      {p.img_path ? (
                        <img src={p.img_path} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-primary/5 flex items-center justify-center text-primary/70">
                          <Coffee className="size-5" />
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white font-mono leading-none">
                        ₱{Number(p.price).toFixed(0)}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-2 min-w-0">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
                        {p.category.name}
                      </p>
                      <h4 className="font-semibold text-foreground text-xs leading-tight truncate mt-0.5" title={p.name}>
                        {p.name}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Interactive Cart Panel (lg:col-span-5 xl:col-span-4) */}
          <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-border bg-card shadow-sm p-4 flex flex-col gap-4 sticky top-6">
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
                <button
                  onClick={clearCart}
                  className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 transition flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Clear
                </button>
              )}
            </div>

            {/* Context Badge if editing active parked order */}
            {editingParkedOrder && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 flex items-center justify-between text-xs text-primary animate-in slide-in-from-top-1">
                <div className="min-w-0">
                  <p className="font-semibold truncate">Editing Parked Order</p>
                  <p className="text-[10px] font-mono text-primary/70 mt-0.5 truncate">{editingParkedOrder.id}</p>
                </div>
                <button
                  onClick={clearCart}
                  className="size-5 rounded hover:bg-primary/20 flex items-center justify-center shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 select-none">
                <ShoppingCart className="size-12 stroke-[1.25] text-muted-foreground/35 animate-pulse" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Station cart empty</p>
                  <p className="text-[11px] max-w-[200px] mx-auto mt-1 leading-normal">
                    Select active classic beverages from the left catalog grid to construct checkout lines.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 p-2 bg-muted/40 rounded-xl border border-border/40 animate-in fade-in"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-foreground truncate">{item.product.name}</p>
                      <p className="font-mono text-[10px] text-primary/80 font-bold mt-0.5">
                        ₱{Number(item.product.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="size-6.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-foreground w-6 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="size-6.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="size-6.5 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition ml-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Discount Promo Field */}
            {cartItems.length > 0 && (
              <div className="flex items-center gap-2 border-t border-border pt-4 mt-1">
                <div className="relative flex-1">
                  <Ticket className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter Coupon (e.g., SUMMER20)"
                    className="pl-8.5 h-8.5 text-xs font-mono uppercase"
                  />
                </div>
                {estimatedDiscount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 font-mono">
                    -{estimatedDiscount}%
                  </span>
                )}
              </div>
            )}

            {/* Choose Payment Type Grid */}
            {cartItems.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1 border-t border-border pt-4">
                <label className="text-[11px] font-semibold text-card-foreground">Choose Payment Type</label>
                <div className="grid grid-cols-4 gap-2 select-none">
                  {/* Cash */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('cash')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${
                      selectedPayment === 'cash'
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Banknote className="size-4 shrink-0" />
                    <span className="text-[9px] font-semibold">Cash</span>
                  </button>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('card')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${
                      selectedPayment === 'card'
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="size-4 shrink-0" />
                    <span className="text-[9px] font-semibold">Card</span>
                  </button>

                  {/* GCash */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('gcash')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${
                      selectedPayment === 'gcash'
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Wallet className="size-4 shrink-0" />
                    <span className="text-[9px] font-semibold">GCash</span>
                  </button>

                  {/* PayMaya */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('maya')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2 border transition-all ${
                      selectedPayment === 'maya'
                        ? 'border-emerald-600 bg-emerald-600/5 text-emerald-600 dark:text-emerald-500'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Wallet className="size-4 shrink-0" />
                    <span className="text-[9px] font-semibold">Maya</span>
                  </button>
                </div>
              </div>
            )}

            {/* Price Calculations */}
            {cartItems.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-4 mt-1 bg-muted/20 rounded-xl p-3 border border-border/40 font-mono">
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
            )}

            {/* Checkouts CTA Buttons */}
            {cartItems.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 select-none">
                <Button
                  onClick={() => handleCheckoutSubmit(false)}
                  disabled={submitting}
                  className="w-full h-10 text-xs font-bold shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground shadow"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle className="size-3.5 animate-spin" /> Processing…
                    </span>
                  ) : editingParkedOrder ? (
                    'Finalize Settlement'
                  ) : (
                    'Checkout'
                  )}
                </Button>

                {!editingParkedOrder && (
                  <Button
                    onClick={() => handleCheckoutSubmit(true)}
                    disabled={submitting}
                    variant="outline"
                    className="w-full h-10 text-xs font-semibold shrink-0 border-primary/20 text-primary hover:bg-primary/5 shadow-none"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-1.5">
                        <LoaderCircle className="size-3.5 animate-spin" /> Parking…
                      </span>
                    ) : (
                      'Park Order'
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ PARKED ORDERS TAB ═══════════════ */}
      {activeTab === 'parked' && !error && (
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
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between gap-4 select-text"
                  >
                    <div>
                      {/* Title row */}
                      <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground font-mono truncate" title={order.id}>
                            Order #{order.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono select-none">
                            {date.toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20 select-none">
                          <Clock className="size-2.5 shrink-0" />
                          Parked
                        </span>
                      </div>

                      {/* Items summary */}
                      {order.items && order.items.length > 0 && (
                        <div className="flex flex-col gap-1 mt-2 max-h-[100px] overflow-y-auto pr-1">
                          {order.items.map((line) => (
                            <div key={line.id} className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span className="truncate max-w-40">• {line.product?.name || 'Beverage Item'}</span>
                              <span className="font-mono font-semibold">Qty: {line.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions and totals */}
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3 mt-2">
                      <div className="text-left font-mono">
                        <p className="text-[10px] text-muted-foreground leading-none">Total Value</p>
                        <p className="text-xs font-extrabold text-primary mt-1">₱{Number(order.total).toFixed(2)}</p>
                      </div>

                      <Button
                        onClick={() => loadParkedOrderForEditing(order)}
                        className="h-8 px-3 text-[10px] font-bold shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 shadow-none inline-flex items-center gap-1"
                      >
                        <ArrowLeftRight className="size-3" /> Edit & Settle
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ COMPLETED ORDERS TAB ═══════════════ */}
      {activeTab === 'completed' && !error && (
        <div className="flex flex-col gap-4">
          {completedOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none py-16">
              <CheckCircle className="size-12 stroke-[1.25] text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
              <div>
                <p className="font-semibold text-foreground text-sm">No completed orders found</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Once orders are settled and fully completed, their payment receipt history lists will trace here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map((order) => {
                const date = new Date(order.created_at);
                const paymentMethod = order.payment?.method || 'cash';

                // Map styling for payment types
                let paymentStyle = 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
                if (paymentMethod === 'card') paymentStyle = 'bg-indigo-500/15 border-indigo-500/20 text-indigo-600 dark:text-indigo-400';
                if (paymentMethod === 'gcash') paymentStyle = 'bg-blue-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400';
                if (paymentMethod === 'maya') paymentStyle = 'bg-emerald-600/15 border-emerald-600/20 text-emerald-600 dark:text-emerald-500';

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between gap-4 select-text"
                  >
                    <div>
                      {/* Title row */}
                      <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground font-mono truncate" title={order.id}>
                            Order #{order.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono select-none">
                            {date.toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
                          <Check className="size-2.5 shrink-0" />
                          Settled
                        </span>
                      </div>

                      {/* Items list */}
                      {order.items && order.items.length > 0 && (
                        <div className="flex flex-col gap-1 mt-2 max-h-[100px] overflow-y-auto pr-1">
                          {order.items.map((line) => (
                            <div key={line.id} className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span className="truncate max-w-40">• {line.product?.name || 'Beverage Item'}</span>
                              <span className="font-mono font-semibold">Qty: {line.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Totals and payment details */}
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between gap-3 mt-2 font-mono">
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground leading-none">Total Settled</p>
                        <p className="text-xs font-extrabold text-foreground mt-1">₱{Number(order.total).toFixed(2)}</p>
                      </div>

                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold border select-none uppercase ${paymentStyle}`}>
                        {paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
