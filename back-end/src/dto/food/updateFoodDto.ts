import type { CreateFoodDto } from "./createFoodDto";

// Dados para atualizar um alimento; todos os campos são opcionais
export type UpdateFoodDto = Partial<CreateFoodDto>;