import type { CreateMealPlanDto } from "./createMealPlanDto";

// Dados para atualizar um plano alimentar; todos os campos são opcionais.
// O paciente do plano não pode ser trocado. Quando "meals" é enviado,
// as refeições anteriores são substituídas pelas novas.
export type UpdateMealPlanDto = Partial<Omit<CreateMealPlanDto, "patientId">>;