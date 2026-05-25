import {
  Coffee,
  MoreHorizontal,
  Package,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Product } from '@/api/products';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProductCard({
  product,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const recipeCount = product.recipes?.length || 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between select-none cursor-context-menu">
          {/* Upper Content */}
          <div>
            {/* Image Header with Actions absolute */}
            <div className="relative h-40 w-full overflow-hidden bg-muted flex items-center justify-center">
              {product.img_path ? (
                <img
                  src={product.img_path}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-linear-to-tr from-primary/10 to-primary/5 flex flex-col items-center justify-center text-primary/70">
                  <Coffee className="size-10 stroke-[1.5] mb-1" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Daily Brew Classic</span>
                </div>
              )}

              {/* Category Label Overlay */}
              <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/10">
                {product.category.name}
              </span>

              {/* Top-Right Context Button Trigger */}
              {isAdmin && (
                <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg bg-black/50 hover:bg-black/75 backdrop-blur-md text-white hover:text-white border border-white/10 action-btn-trigger shadow"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const event = new MouseEvent('contextmenu', {
                        bubbles: true,
                        cancelable: true,
                        clientX: e.clientX,
                        clientY: e.clientY,
                      });
                      e.currentTarget.dispatchEvent(event);
                    }}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Details Area */}
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground tracking-tight text-sm line-clamp-1 truncate" title={product.name}>
                  {product.name}
                </h3>
                <span className="font-mono text-sm font-bold text-primary shrink-0">
                  ₱{Number(product.price).toFixed(2)}
                </span>
              </div>

              {/* Ingredients Counter / Formula expander button */}
              {recipeCount > 0 ? (
                <button
                  onClick={onToggleExpand}
                  className="inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-muted/65 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground font-medium transition"
                >
                  <span className="flex items-center gap-1">
                    <Package className="size-3.5 text-primary/70" />
                    Recipe formula: {recipeCount} item{recipeCount > 1 ? 's' : ''}
                  </span>
                  {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-500 font-semibold select-none">
                  <AlertCircle className="size-3.5" /> No ingredients linked to recipe
                </div>
              )}

              {/* Expanded details container */}
              {isExpanded && product.recipes && (
                <div className="mt-1 border-t border-border/60 pt-2 flex flex-col gap-1.5 max-h-27.5 overflow-y-auto pr-1 animate-in slide-in-from-top-1 duration-200">
                  {product.recipes.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground truncate max-w-28 font-medium">
                        • {rec.ingredient.name}
                      </span>
                      <span className="font-mono text-foreground/80 bg-muted px-1.5 py-0.5 rounded font-bold">
                        {Number(rec.quantity).toFixed(1)} {rec.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lower Area Actions for normal triggers */}
          {isAdmin && (
            <div className="p-4 pt-0">
              <Button
                variant="outline"
                onClick={onEdit}
                className="w-full h-8 text-[11px] font-semibold border-muted-foreground/15 hover:bg-primary/5 hover:text-primary transition"
              >
                <Edit3 className="size-3 mr-1" /> Configure Product
              </Button>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48 bg-card border border-border text-foreground shadow-md rounded-md p-1 z-50">
        <ContextMenuItem
          onSelect={onEdit}
          className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer"
        >
          <Edit3 className="size-3.5 text-muted-foreground" />
          Configure Product
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={onDelete}
          className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition cursor-pointer"
        >
          <Trash2 className="size-3.5" />
          Delete Product
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
