import { Coffee, X, ImagePlus, LoaderCircle } from 'lucide-react';
import type { Category } from '@/api/categories';
import type { Ingredient } from '@/api/ingredients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecipeLine } from './types';
import RecipeFormulaBuilder from './RecipeFormulaBuilder';

interface CreateProductDialogProps {
  open: boolean;
  categories: Category[];
  ingredients: Ingredient[];
  formName: string;
  formPrice: string;
  formCategoryId: string;
  formImagePreview: string | null;
  formRecipeLines: RecipeLine[];
  submitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onFormNameChange: (val: string) => void;
  onFormPriceChange: (val: string) => void;
  onFormCategoryIdChange: (val: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onAddRecipeLine: () => void;
  onRemoveRecipeLine: (key: number) => void;
  onUpdateRecipeLine: (key: number, field: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreateProductDialog({
  open,
  categories,
  ingredients,
  formName,
  formPrice,
  formCategoryId,
  formImagePreview,
  formRecipeLines,
  submitting,
  fileInputRef,
  onClose,
  onFormNameChange,
  onFormPriceChange,
  onFormCategoryIdChange,
  onImageChange,
  onClearImage,
  onAddRecipeLine,
  onRemoveRecipeLine,
  onUpdateRecipeLine,
  onSubmit,
}: CreateProductDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Coffee className="size-5 text-primary" /> Register New Product
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Image Upload Dropzone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">Product Display Image</label>
            <div className="flex items-center gap-4">
              {formImagePreview ? (
                <div className="relative size-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                  <img src={formImagePreview} alt="Preview" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="absolute right-1 top-1 size-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="size-20 rounded-xl border border-dashed border-muted-foreground/35 hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center text-muted-foreground shrink-0"
                >
                  <ImagePlus className="size-5 mb-1" />
                  <span className="text-[10px] font-medium">Upload</span>
                </button>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">Product Image</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-70">
                  Provide a clear JPEG or PNG layout. File uploads map seamlessly to remote cloud storage.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-2.5 text-[10px] mt-2 font-medium"
                >
                  Browse local files
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* General Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">
                Product Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={formName}
                onChange={(e) => onFormNameChange(e.target.value)}
                placeholder="e.g., Iced Matcha Latte"
                className="h-10 text-sm"
                maxLength={50}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-card-foreground">
                Retail Price (₱) <span className="text-destructive">*</span>
              </label>
              <Input
                value={formPrice}
                onChange={(e) => onFormPriceChange(e.target.value)}
                placeholder="e.g., 140.00"
                type="number"
                step="0.01"
                min="0"
                className="h-10 text-sm font-mono"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-card-foreground">
              Category Tag <span className="text-destructive">*</span>
            </label>
            {categories.length > 0 ? (
              <Select value={formCategoryId} onValueChange={onFormCategoryIdChange}>
                <SelectTrigger className="h-10 text-sm bg-background border border-border">
                  <SelectValue placeholder="Select Category Tag" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-destructive font-semibold italic">Please create a Category under Inventory settings first.</p>
            )}
          </div>

          {/* Recipe Formula Builder */}
          <RecipeFormulaBuilder
            recipeLines={formRecipeLines}
            ingredients={ingredients}
            onAddLine={onAddRecipeLine}
            onRemoveLine={onRemoveRecipeLine}
            onUpdateLine={onUpdateRecipeLine}
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || categories.length === 0}
              className="h-9 px-4 text-xs font-semibold"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1.5">
                  <LoaderCircle className="size-3.5 animate-spin" /> Saving…
                </span>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
