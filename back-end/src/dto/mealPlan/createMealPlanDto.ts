import type { MealDto } from "../diet/createDietDto";

// Dados para atribuir um plano alimentar a um paciente.
// Se "meals" não for enviado e houver "dietId", as refeições do modelo são copiadas.
export interface CreateMealPlanDto {
  patientId: number;

  name: string;

  startDate: Date;

  notes?: string | null;

  // Modelo de dieta usado como base (opcional)
  dietId?: number | null;

  meals?: MealDto[];
}