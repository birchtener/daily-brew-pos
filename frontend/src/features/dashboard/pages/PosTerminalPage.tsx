import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, ShoppingCart, X } from 'lucide-react';
import {
  checkout,
  getParkedOrders,
  getCompletedOrders,
  finalizeParkedOrder,
  type Order,
  getCancelledOrders,
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
import CancelledList from '../components/pos/CancelledList';
import { toast } from 'sonner';
import ConfirmationDialog from '@/features/dashboard/components/pos/ConfirmationDialog';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function PosTerminalPage() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'parked' | 'completed' | 'cancelled'>('terminal');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [parkedOrders, setParkedOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchVal, setSearchVal] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all-categories');

  const [orderSearchVal, setOrderSearchVal] = useState('');
  const [orderSortVal, setOrderSortVal] = useState('date-desc');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [editingParkedOrder, setEditingParkedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVoidCartOpen, setIsVoidCartOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodsData, catsData, parkedData, completedData, cancelledData] = await Promise.all([
        getProducts(),
        getCategories(),
        getParkedOrders(),
        getCompletedOrders(),
        getCancelledOrders(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setParkedOrders(parkedData);
      setCompletedOrders(completedData);
      setCancelledOrders(cancelledData);
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
    } else if (activeTab === 'cancelled') {
      getCancelledOrders().then(setCancelledOrders).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    setOrderSearchVal('');
    setOrderSortVal('date-desc');
  }, [activeTab]);

  const addToCart = (product: Product) => {
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
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountCode('');
    setSelectedPayment('cash');
    setEditingParkedOrder(null);
    setIsMobileCartOpen(false);
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

    setActiveTab('terminal');
  };

  const handleCheckoutSubmit = async (park = false) => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Please add products.');
      return;
    }

    setSubmitting(true);

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
        toast.success('Parked order successfully settled and completed!');
      } else {
        await checkout({
          discount_code: discountCode.trim() || null,
          items: itemsPayload,
          park,
          payment_method: park ? null : selectedPayment,
        });

        if (park) {
          toast.success('Order successfully parked!');
        } else {
          toast.success('Order checkout successfull!');
        }
      }

      const [parkedData, completedData, prodsData, cancelledData] = await Promise.all([
        getParkedOrders(),
        getCompletedOrders(),
        getProducts(),
        getCancelledOrders(),
      ]);
      setParkedOrders(parkedData);
      setCompletedOrders(completedData);
      setProducts(prodsData);
      setCancelledOrders(cancelledData);
      clearCart();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'POS checkout processing failed.'));
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

  const getFilteredAndSortedOrders = (ordersList: Order[]) => {
    // 1. Search Filter
    let filtered = ordersList.filter((order) => {
      const orderIdMatch = order.id.toLowerCase().includes(orderSearchVal.toLowerCase());
      const itemsMatch = order.items?.some((item) => {
        const prodName = item.product?.name || '';
        return prodName.toLowerCase().includes(orderSearchVal.toLowerCase());
      });
      return orderIdMatch || itemsMatch;
    });

    // 2. Sorting
    filtered.sort((a, b) => {
      if (orderSortVal === 'date-desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (orderSortVal === 'date-asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (orderSortVal === 'amount-desc') {
        return Number(b.total) - Number(a.total);
      }
      if (orderSortVal === 'amount-asc') {
        return Number(a.total) - Number(b.total);
      }
      return 0;
    });

    return filtered;
  };

  return (
    <div className="flex flex-col gap-6 px-1 sm:px-4 pb-12 w-full max-w-7xl mx-auto select-none">
      <PosToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parkedCount={parkedOrders.length}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        orderSearchVal={orderSearchVal}
        setOrderSearchVal={setOrderSearchVal}
        orderSortVal={orderSortVal}
        setOrderSortVal={setOrderSortVal}
      />

      {error && (
        <div className="p-8 text-center text-destructive border border-border bg-card rounded-xl">
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
            className="hidden lg:flex lg:col-span-5 xl:col-span-4"
            cartItems={cartItems}
            clearCart={() => setIsVoidCartOpen(true)}
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
          <ParkedList parkedOrders={getFilteredAndSortedOrders(parkedOrders)} fetchData={fetchData} loadParkedOrderForEditing={loadParkedOrderForEditing} />
        </div>
      )}

      {activeTab === 'completed' && !error && (
        <div className="flex flex-col gap-4">
          <CompletedList completedOrders={getFilteredAndSortedOrders(completedOrders)} fetchData={fetchData} />
        </div>
      )}

      {activeTab === 'cancelled' && !error && (
        <div className="flex flex-col gap-4">
          <CancelledList cancelledOrders={getFilteredAndSortedOrders(cancelledOrders)} fetchData={fetchData} />
        </div>
      )}

      <ConfirmationDialog
        isOpen={isVoidCartOpen}
        onClose={() => setIsVoidCartOpen(false)}
        onConfirm={() => {
          clearCart();
          setIsVoidCartOpen(false);
        }}
        title="Void Current Order"
        description="Are you sure you want to clear your current checkout session? This will remove all items from the cart and reset any discount coupon code entered."
        confirmText="Void Cart"
      />

      {/* Mobile Floating Cart FAB (Floating bottom left) */}
      {cartItems.length > 0 && activeTab === 'terminal' && (
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-40 bg-primary text-background shadow-lg hover:shadow-xl rounded-full p-4 flex items-center justify-center border border-primary/20 cursor-pointer animate-in zoom-in-95 hover:scale-105 transition-all duration-300"
        >
          <div className="relative">
            <ShoppingCart className="size-6 stroke-[2]" />
            <span className="absolute -top-3.5 -right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm border-2 border-background animate-bounce">
              {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Mobile Drawer Cart Sheet */}
      {isMobileCartOpen && activeTab === 'terminal' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 lg:hidden">
          <div className="w-full rounded-t-3xl border-t border-border bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto relative flex flex-col gap-4">
            {/* Close Swipe Handle Bar */}
            <div className="w-12 h-1 bg-border/80 rounded-full mx-auto -mt-2 mb-2 shrink-0 cursor-pointer" onClick={() => setIsMobileCartOpen(false)} />

            <div className="flex items-center justify-between border-b border-border pb-3.5 shrink-0 select-none">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="size-4.5 text-primary" /> Mobile Shopping Cart
              </h2>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              <CartPanel
                className="flex w-full border-none shadow-none p-0 sticky-none relative bg-transparent"
                cartItems={cartItems}
                clearCart={() => setIsVoidCartOpen(true)}
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
          </div>
        </div>
      )}
    </div>
  );
}