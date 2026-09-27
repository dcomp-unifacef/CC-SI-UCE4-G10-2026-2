import type { ActivityLevel } from "../../../generated/prisma/client";

// Dados para atualizar uma avaliação corporal; todos os campos são opcionais
export interface UpdateBodyAssessmentDto {
  assessmentDate?: Date;

  // Peso em kg
  weight?: number;

  // Altura em metros
  height?: number;

  activityLevel?: ActivityLevel;
}
