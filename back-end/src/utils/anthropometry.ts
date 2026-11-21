import type { ActivityLevel, BiologicalSex } from "../../generated/prisma/client"

// Fator de atividade física usado no cálculo do Gasto Energético Total (GET)
export const activityFactors: Record<ActivityLevel, number> = {
    SEDENTARIO: 1.2,
    LIGEIRAMENTE_ATIVO: 1.375,
    MODERADAMENTE_ATIVO: 1.55,
    MUITO_ATIVO: 1.725,
    EXTREMAMENTE_ATIVO: 1.9
}

// Idade em anos completos em uma data de referência
export function calculateAge(birthDate: Date, reference = new Date()): number {
    let age = reference.getUTCFullYear() - birthDate.getUTCFullYear()

    const beforeBirthday =
        reference.getUTCMonth() < birthDate.getUTCMonth() ||
        (reference.getUTCMonth() === birthDate.getUTCMonth() && reference.getUTCDate() < birthDate.getUTCDate())

    if (beforeBirthday) age--

    return age
}

export type AnthropometricResult = {
    bmi: number;        // IMC (kg/m²)
    water: number;      // Recomendação de água (ml/dia) = 35 ml × peso
    bmr: number;        // TMB (kcal/dia), equação de Mifflin-St Jeor
    tee: number;        // GET (kcal/dia) = TMB × fator de atividade
}

export function calculateAnthropometry(
    weight: number,
    height: number,
    age: number,
    biologicalSex: BiologicalSex,
    activityLevel: ActivityLevel
): AnthropometricResult {
    const bmi = weight / (height * height)

    // Mifflin-St Jeor: 10 × peso + 6,25 × altura(cm) − 5 × idade + 5 (homens) ou − 161 (mulheres)
    const bmr = 10 * weight + 6.25 * height * 100 - 5 * age + (biologicalSex === "MASCULINO" ? 5 : -161)

    const tee = bmr * activityFactors[activityLevel]

    return {
        bmi: Math.round(bmi * 10) / 10,
        water: Math.round(weight * 35),
        bmr: Math.round(bmr),
        tee: Math.round(tee)
    }
}