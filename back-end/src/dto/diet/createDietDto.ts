// Alimento de uma refeição; a quantidade usa a mesma unidade (g ou ml) da porção do alimento
export interface MealItemDto {
  foodId: number;

  quantity: number;
}

// Refeição do modelo de dieta (ex.: 07:00 · Café da manhã)
export interface MealDto {
  name: string;

  // Horário no formato HH:MM
  time: string;

  items: MealItemDto[];
}

// Dados necessários para cadastrar um modelo de dieta com suas refeições
export interface CreateDietDto {
  name: string;

  notes?: string | null;

  meals: MealDto[];
}