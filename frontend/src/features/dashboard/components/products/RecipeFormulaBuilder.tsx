import { Plus, Trash2 } from 'lucide-react';
import type { Ingredient, Unit } from '@/api/ingredients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type RecipeLine, getAllowedUnits } from './types';

interface RecipeFormulaBuilderProps {
  recipeLines: RecipeLine[];
  ingredients: Ingredient[];
  onAddLine: () => void;
  onRemoveLine: (key: number) => void;
  onUpdateLine: (key: number, field: string, value: any) => void;
}

export default function RecipeFormulaBuilder({
  recipeLines,
  ingredients,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
}: RecipeFormulaBuilderProps) {
  return (
    <div className="border-t border-border pt-4 mt-1">
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="text-xs font-semibold text-card-foreground flex items-center gap-1">
            Recipe
          </label>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            List the precise ingredients quantities consumed per serving.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddLine}
          disabled={ingredients.length === 0}
          className="h-7 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 shrink-0 inline-flex items-center gap-1"
        >
          <Plus className="size-3" /> Add Row
        </Button>
      </div>

      {recipeLines.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground select-none text-[11px]">
          No recipe items linked. This product will register without automatically consuming inventory stocks upon sales.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-45 overflow-y-auto pr-1">
          {recipeLines.map((line) => (
            <div key={line._key} className="flex flex-col gap-2 animate-in fade-in duration-200 sm:flex-row sm:items-center">
              {/* Ingredient Dropdown */}
              <div className="min-w-0 flex-1">
                <Select
                  value={line.ingredient_id}
                  onValueChange={(val) => onUpdateLine(line._key, 'ingredient_id', val)}
                >
                  <SelectTrigger className="h-8.5 text-[11px] bg-background border border-border">
                    <SelectValue placeholder="Choose Ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id} className="text-[11px]">
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Qty Input */}
              <div className="w-full shrink-0 sm:w-24.5">
                <Input
                  value={line.quantity}
                  onChange={(e) => onUpdateLine(line._key, 'quantity', e.target.value)}
                  placeholder="Qty"
                  type="number"
                  step="any"
                  min="0.0001"
                  className="h-8.5 text-[11px] font-mono text-center"
                  required
                />
              </div>

              {/* Unit changer select block */}
              <div className="w-full shrink-0 sm:w-20">
                {(() => {
                  const foundIng = ingredients.find((i) => i.id === line.ingredient_id);
                  const baseUnit = foundIng ? foundIng.unit : line.unit;
                  const allowed = getAllowedUnits(baseUnit);
                  
                  return allowed.length > 1 ? (
                    <Select
                      value={line.unit}
                      onValueChange={(val) => onUpdateLine(line._key, 'unit', val as Unit)}
                    >
                      <SelectTrigger className="h-8.5 text-[11px] bg-background border border-border">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowed.map((u) => (
                          <SelectItem key={u} value={u} className="text-[11px] uppercase">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="inline-block text-[10px] font-mono font-bold text-muted-foreground select-none uppercase px-2 py-1 bg-muted rounded border border-border/40">
                      {line.unit}
                    </span>
                  );
                })()}
              </div>

              {/* Remove Line */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveLine(line._key)}
                className="size-8.5 shrink-0 self-end rounded-lg text-rose-500 hover:bg-rose-500/10 sm:self-auto"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
