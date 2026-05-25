 
import { Coffee } from 'lucide-react';
import type { Product } from '@/api/products';

interface Props {
  product: Product;
  onAdd: (p: Product) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  return (
    <button
      onClick={() => onAdd(product)}
      className="group flex flex-col justify-between text-left rounded-xl border border-border bg-card p-3 shadow-none hover:shadow hover:border-primary/50 transition-all duration-300 overflow-hidden h-45"
    >
      <div className="relative h-20 w-full overflow-hidden bg-muted rounded-lg flex items-center justify-center shrink-0">
        {product.img_path ? (
          <img src={product.img_path} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-linear-to-tr from-primary/10 to-primary/5 flex items-center justify-center text-primary/70">
            <Coffee className="size-5" />
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white font-mono leading-none">
          ₱{Number(product.price).toFixed(0)}
        </span>
      </div>

      <div className="mt-2 min-w-0">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{product.category.name}</p>
        <h4 className="font-semibold text-foreground text-xs leading-tight truncate mt-0.5" title={product.name}>{product.name}</h4>
      </div>
    </button>
  );
}
