import ProductCard from './ProductCard';
import { Coffee, Search } from 'lucide-react';
import type { Product } from '@/api/products';

interface Props {
  filteredProducts: Product[];
  loading: boolean;
  products: Product[];
  addToCart: (p: Product) => void;
}

export default function ProductGrid({ filteredProducts, loading, products, addToCart }: Props) {
  if (products.length === 0 && !loading) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none">
        <Coffee className="size-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="font-semibold text-foreground">No active products</p>
        <p className="text-xs">Create beverages catalog items under Inventory settings first.</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-border bg-card rounded-xl select-none">
        <Search className="size-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="font-semibold">No matches found</p>
        <p className="text-xs">Try adjusting your search terms or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {filteredProducts.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={addToCart} />
      ))}
    </div>
  );
}
