import type { Meal, NutritionTotals } from './Diet';

// Plano alimentar atribuído a um paciente
export type MealPlan = {
  id: number;
  name: string;
  startDate: string;
  notes: string | null;
  patientId: number;
  dietId: number | null;
  diet: { id: number; name: string } | null; // modelo usado como base
  meals: Meal[];
  totals: NutritionTotals;
};