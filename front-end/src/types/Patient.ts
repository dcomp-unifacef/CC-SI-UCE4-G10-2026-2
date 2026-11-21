export type BiologicalSex = 'MASCULINO' | 'FEMININO';

export type ActivityLevel =
  | 'SEDENTARIO'
  | 'LIGEIRAMENTE_ATIVO'
  | 'MODERADAMENTE_ATIVO'
  | 'MUITO_ATIVO'
  | 'EXTREMAMENTE_ATIVO';

// Resumo da última avaliação corporal, com os indicadores calculados pelo back-end
export type LatestAssessment = {
  id: number;
  assessmentDate: string;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  bmi: number;   // IMC
  water: number; // água recomendada (ml/dia)
  bmr: number;   // TMB (kcal)
  tee: number;   // GET (kcal)
};

export type Patient = {
  id: number;
  name: string;
  birthDate: string;
  gender: string;
  biologicalSex: BiologicalSex;
  cpf: string;
  phone: string;
  active: boolean;
  age: number;
  latestAssessment: LatestAssessment | null;
};