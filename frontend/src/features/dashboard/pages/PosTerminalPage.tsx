import { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  checkout,
  getParkedOrders,
  getCompletedOrders,
  finalizeParkedOrder,
  type Order,
} from '@/api/orders';
import { getProducts, type Product } from '@/api/products';
import { getCategories, type Category } from '@/api/categories';
import { Button } from '@/components/ui/button';
import PosToolbar from '@/features/dashboard/components/pos/PosToolbar';
import ProductGrid from '@/features/dashboard/components/pos/ProductGrid';
import ParkedList from '@/features/dashboard/components/pos/ParkedList';
import CompletedList from '@/features/dashboard/components/pos/CompletedList';
import CartPanel from '@/features/dashboard/components/pos/CartPanel';
import { extractErrorMessage } from '@/lib/extractErrorMessage';

type CartItem = {
  product: Product;
  quantity: number;
};

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

export default function PosTerminalPage() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'parked' | 'completed'>('terminal');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parkedOrders, setParkedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchVal, setSearchVal] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [editingParkedOrder, setEditingParkedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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

  useEffect(() => {
    if (activeTab === 'parked') {
      getParkedOrders().then(setParkedOrders).catch(() => {});
    } else if (activeTab === 'completed') {
      getCompletedOrders().then(setCompletedOrders).catch(() => {});
    }
  }, [activeTab]);

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
            return { ...item, quantity: item.quantity + delta };
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

  const subTotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  let estimatedDiscount = 0;
  if (discountCode.trim().toUpperCase() === 'WELCOME10') estimatedDiscount = 10;
  if (discountCode.trim().toUpperCase() === 'SUMMER20') estimatedDiscount = 20;

  const discountAmount = (subTotal * estimatedDiscount) / 100;
  const total = subTotal - discountAmount;

  const loadParkedOrderForEditing = (order: Order) => {
    clearCart();
    setEditingParkedOrder(order);
    setDiscountCode(order.discount_code || '');

    if (order.items) {
      const mapped: CartItem[] = [];
      order.items.forEach((item) => {
        const matchingProduct = products.find((p) => p.id === item.product_id);
        if (matchingProduct) {
          mapped.push({ product: matchingProduct, quantity: item.quantity });
        }
      });
      setCartItems(mapped);
    }

    setFeedback(null);
    setActiveTab('terminal');
  };

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
        await finalizeParkedOrder(editingParkedOrder.id, {
          discount_code: discountCode.trim() || null,
          items: itemsPayload,
          payment_method: selectedPayment,
        });
        setFeedback({ type: 'success', message: 'Parked order successfully settled and completed!' });
      } else {
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

      const [parkedData, completedData, prodsData] = await Promise.all([
        getParkedOrders(),
        getCompletedOrders(),
        getProducts(),
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      p.category.name.toLowerCase().includes(searchVal.toLowerCase());
    const matchesCat = categoryFilter === 'all-categories' || p.category_id === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-400 mx-auto select-none">
      <PosToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parkedCount={parkedOrders.length}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        setFeedback={setFeedback}
      />

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm transition-all animate-in fade-in slide-in-from-top-1 ${
            feedback.type === 'error'
              ? 'border border-destructive/20 bg-destructive/10 text-destructive'
              : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <AlertCircle className="size-4 shrink-0" />
          {feedback.message}
        </div>
      )}

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

      {activeTab === 'terminal' && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <ProductGrid
              filteredProducts={filteredProducts}
              loading={loading}
              products={products}
              addToCart={addToCart}
            />
          </div>

          <CartPanel
            cartItems={cartItems}
            clearCart={clearCart}
            editingParkedOrder={editingParkedOrder}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            discountCode={discountCode}
            setDiscountCode={setDiscountCode}
            estimatedDiscount={estimatedDiscount}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            subTotal={subTotal}
            discountAmount={discountAmount}
            total={total}
            handleCheckoutSubmit={handleCheckoutSubmit}
            submitting={submitting}
          />
        </div>
      )}

      {activeTab === 'parked' && !error && (
        <div className="flex flex-col gap-4">
          <ParkedList parkedOrders={parkedOrders} loadParkedOrderForEditing={loadParkedOrderForEditing} />
        </div>
      )}

      {activeTab === 'completed' && !error && (
        <div className="flex flex-col gap-4">
          <CompletedList completedOrders={completedOrders} />
        </div>
      )}
    </div>
  );
}