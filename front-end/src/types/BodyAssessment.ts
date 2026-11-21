import type { ActivityLevel } from './Patient';

// Avaliação corporal com os indicadores calculados pelo back-end
export type BodyAssessment = {
  id: number;
  patientId: number;
  patient: { id: number; name: string };
  assessmentDate: string;
  weight: number;   // kg
  height: number;   // m
  activityLevel: ActivityLevel;
  age: number;      // idade na data da avaliação
  bmi: number;      // IMC
  water: number;    // água recomendada (ml/dia)
  bmr: number;      // TMB (kcal)
  tee: number;      // GET (kcal)
};