import type { Food } from './Food';

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

export type MealItem = {
  id: number;
  foodId: number;
  quantity: number;
  food: Food;
  totals: NutritionTotals;
};

export type Meal = {
  id: number;
  name: string;
  time: string;
  position: number;
  items: MealItem[];
  totals: NutritionTotals;
};

export type Diet = {
  id: number;
  name: string;
  notes: string | null;
  meals: Meal[];
  totals: NutritionTotals;
};