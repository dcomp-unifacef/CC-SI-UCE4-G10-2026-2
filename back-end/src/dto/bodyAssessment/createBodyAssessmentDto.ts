import type { ActivityLevel } from "../../../generated/prisma/client";

// Dados necessários para registrar uma nova avaliação corporal de um paciente
export interface CreateBodyAssessmentDto {
  patientId: number;

  assessmentDate: Date;

  // Peso em kg
  weight: number;

  // Altura em metros
  height: number;

  activityLevel: ActivityLevel;
}
