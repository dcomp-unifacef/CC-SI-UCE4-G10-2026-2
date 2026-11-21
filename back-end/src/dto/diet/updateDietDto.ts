import type { CreateDietDto } from "./createDietDto";

// Dados para atualizar um modelo de dieta; todos os campos são opcionais.
// Quando "meals" é enviado, as refeições anteriores são substituídas pelas novas.
export type UpdateDietDto = Partial<CreateDietDto>;