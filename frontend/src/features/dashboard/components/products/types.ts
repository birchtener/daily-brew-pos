import type { Unit } from '@/api/ingredients';

export const WEIGHT_UNITS = ['kg', 'g', 'mg'] as const;
export const VOLUME_UNITS = ['l', 'ml', 'oz'] as const;

export interface RecipeLine {
  _key: number;
  ingredient_id: string;
  quantity: string;
  unit: Unit;
}

export function getAllowedUnits(baseUnit: Unit): Unit[] {
  if (WEIGHT_UNITS.includes(baseUnit as any)) {
    return WEIGHT_UNITS as unknown as Unit[];
  }
  if (VOLUME_UNITS.includes(baseUnit as any)) {
    return VOLUME_UNITS as unknown as Unit[];
  }
  return [baseUnit];
}
