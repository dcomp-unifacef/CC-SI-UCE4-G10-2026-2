import type { ActivityLevel } from "../../../generated/prisma/client";
import type { CreateBodyAssessmentDto } from "./createBodyAssessmentDto";

// Dados para atualizar uma avaliação corporal; todos os campos são opcionais
export type UpdateBodyAssessmentDto = Partial<CreateBodyAssessmentDto>;