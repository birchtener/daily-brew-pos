export const Unit = {
  kg: "kg",
  g: "g",
  mg: "mg",
  l: "l",
  ml: "ml",
  oz: "oz",
  pcs: "pcs",
  box: "box",
  can: "can",
} as const;

export type UnitType = keyof typeof Unit;

const CONVERSION_RATES: Record<string, number> = {
  "kg_to_g": 1000,
  "g_to_kg": 0.001,
  "g_to_mg": 1000,
  "mg_to_g": 0.001,
  "kg_to_mg": 1000000,
  "mg_to_kg": 0.000001,

  "l_to_ml": 1000,
  "ml_to_l": 0.001,
  "oz_to_ml": 29.5735,  
  "ml_to_oz": 0.033814,
  "l_to_oz": 33.814,
  "oz_to_l": 0.0295735,

  "box_to_pcs": 24,     
  "pcs_to_box": 1 / 24,
  "box_to_can": 24,     
  "can_to_box": 1 / 24,
  "pcs_to_can": 1,      
  "can_to_pcs": 1,
};

export const convertUnit = (quantity: number, fromUnit: UnitType, toUnit: UnitType): number => {
  const from = fromUnit.toLowerCase() as UnitType;
  const to = toUnit.toLowerCase() as UnitType;

  if (from === to) return quantity;

  const key = `${from}_to_${to}`;
  const rate = CONVERSION_RATES[key];

  if (rate === undefined) {
    throw new Error(`Incompatible Unit Conversion Action: Cannot resolve a mapping track from "${fromUnit}" directly to "${toUnit}".`);
  }

  return quantity * rate;
};