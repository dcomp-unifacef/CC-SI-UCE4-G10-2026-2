import type { ActivityLevel, BiologicalSex } from '../types/Patient'

// Mesmas fórmulas usadas no back-end, aqui para mostrar os resultados
// enquanto a avaliação é digitada (antes de salvar).

export const activityFactors: Record<ActivityLevel, number> = {
  SEDENTARIO: 1.2,
  LIGEIRAMENTE_ATIVO: 1.375,
  MODERADAMENTE_ATIVO: 1.55,
  MUITO_ATIVO: 1.725,
  EXTREMAMENTE_ATIVO: 1.9,
}

// Idade em anos completos em uma data de referência ("AAAA-MM-DD")
export function ageAt(birthDate: string, referenceDate: string) {
  const birth = new Date(birthDate)
  const reference = new Date(referenceDate)
  let age = reference.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    reference.getUTCMonth() < birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() && reference.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age--
  return age
}

export function calculateAnthropometry(
  weight: number,
  height: number,
  age: number,
  biologicalSex: BiologicalSex,
  activityLevel: ActivityLevel
) {
  const bmi = weight / (height * height)
  // Mifflin-St Jeor
  const bmr = 10 * weight + 6.25 * height * 100 - 5 * age + (biologicalSex === 'MASCULINO' ? 5 : -161)
  const tee = bmr * activityFactors[activityLevel]

  return {
    bmi: Math.round(bmi * 10) / 10,
    water: Math.round(weight * 35),
    bmr: Math.round(bmr),
    tee: Math.round(tee),
  }
}

// Classificação do IMC para adultos (OMS)
export function bmiClassification(bmi: number) {
  if (bmi < 18.5) return 'Baixo peso'
  if (bmi < 25) return 'Peso adequado'
  if (bmi < 30) return 'Sobrepeso'
  if (bmi < 35) return 'Obesidade grau I'
  if (bmi < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}