import { useEffect, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
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

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [editingParkedOrder, setEditingParkedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isVoidCartOpen, setIsVoidCartOpen] = useState(false);

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
          <ParkedList parkedOrders={parkedOrders} fetchData={fetchData} loadParkedOrderForEditing={loadParkedOrderForEditing} />
        </div>
      )}

      {activeTab === 'completed' && !error && (
        <div className="flex flex-col gap-4">
          <CompletedList completedOrders={completedOrders} fetchData={fetchData} />
        </div>
      )}

      {activeTab === 'cancelled' && !error && (
        <div className="flex flex-col gap-4">
          <CancelledList cancelledOrders={cancelledOrders} fetchData={fetchData} />
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
    </div>
  );
}