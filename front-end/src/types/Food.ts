export type MeasureUnit = 'G' | 'ML';

// Valores nutricionais referentes à porção (portionAmount + portionUnit)
export type Food = {
  id: number;
  name: string;
  portionAmount: number;
  portionUnit: MeasureUnit;
  portionNote: string | null;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  isDefault: boolean;
};