import { prisma } from "../database/client";
import { include as mealsInclude, mealsToCreate } from "./dietRepository";

import type { MealDto } from "../dto/diet/createDietDto";

// Refeições com alimentos + nome do modelo de origem
const include = {
    ...mealsInclude,
    diet: { select: { id: true, name: true } }
}

type MealPlanData = {
    name: string;
    startDate: Date;
    notes: string | null;
    dietId: number | null;
}

// Cria um plano alimentar para o paciente, junto com suas refeições
export function create(patientId: number, data: MealPlanData, meals: MealDto[]) {
    return prisma.mealPlan.create({
        data: {
            ...data,
            patientId,
            meals: { create: mealsToCreate(meals) }
        },
        include
    })
}

// Encontra um plano alimentar por seu id
export function findById(id: number) {
    return prisma.mealPlan.findUnique({
        where: { id },
        include
    })
}

// Lista todos os planos alimentares, dos mais recentes para os mais antigos
export function findAll() {
    return prisma.mealPlan.findMany({
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        include
    })
}

// Lista os planos alimentares de um paciente, dos mais recentes para os mais antigos
export function findAllByPatientId(patientId: number) {
    return prisma.mealPlan.findMany({
        where: { patientId },
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        include
    })
}

// Atualiza um plano; se houver refeições, substitui todas as anteriores
export function updateById(id: number, data: Partial<MealPlanData>, meals?: MealDto[]) {
    return prisma.mealPlan.update({
        where: { id },
        data: {
            ...data,
            ...(meals && {
                meals: {
                    deleteMany: {},
                    create: mealsToCreate(meals)
                }
            })
        },
        include
    })
}

// Exclui um plano alimentar (as refeições são excluídas em cascata)
export function deleteById(id: number) {
    return prisma.mealPlan.delete({
        where: { id },
        include
    })
}