import type { MeasureUnit } from "../../../generated/prisma/client";

// Dados necessários para cadastrar um alimento.
// Os valores nutricionais se referem à porção informada (portionAmount + portionUnit).
export interface CreateFoodDto {
  name: string;

  // Quantidade da porção de referência (ex.: 100)
  portionAmount: number;

  // Unidade da porção: G (gramas) ou ML (mililitros)
  portionUnit: MeasureUnit;

  // Descrição opcional da porção (ex.: "1 unidade")
  portionNote?: string | null;

  // Energia em kcal
  calories: number;

  // Macronutrientes e fibras em gramas
  protein: number;

  carbohydrates: number;

  fat: number;

  fiber: number;
}