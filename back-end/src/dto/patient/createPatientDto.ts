import type { BiologicalSex } from "../../../generated/prisma/client";

// Dados necessários para cadastrar um novo paciente
// Campos obrigatórios pois são necessários para a avaliação corporal
export interface CreatePatientDto {
  name: string;

  birthDate: Date;

  gender: string;

  biologicalSex: BiologicalSex;

  // CPF com ou sem máscara (000.000.000-00 ou 00000000000)
  cpf: string;

  phone: string;
}