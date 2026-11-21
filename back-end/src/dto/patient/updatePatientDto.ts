import type { BiologicalSex } from "../../../generated/prisma/client";
import type { CreatePatientDto } from "./createPatientDto";

// Dados para atualizar um paciente; todos os campos são opcionais
export type UpdatePatientDto = Partial<CreatePatientDto>