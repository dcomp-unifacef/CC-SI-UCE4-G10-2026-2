import { prisma } from "../database/client";

import type { MealDto } from "../dto/diet/createDietDto";

// Refeições ordenadas pela posição, com os alimentos de cada uma
// (também usado pelos planos alimentares dos pacientes)
export const include = {
    meals: {
        orderBy: { position: "asc" as const },
        include: {
            items: {
                orderBy: { id: "asc" as const },
                include: { food: true }
            }
        }
    }
}

// Converte as refeições do DTO para o formato de criação aninhada do Prisma
export function mealsToCreate(meals: MealDto[]) {
    return meals.map((meal, position) => ({
        name: meal.name,
        time: meal.time,
        position,
        items: {
            create: meal.items.map(item => ({
                foodId: item.foodId,
                quantity: item.quantity
            }))
        }
    }))
}

// Cria um modelo de dieta junto com suas refeições e alimentos
export function create(name: string, notes: string | null, meals: MealDto[]) {
    return prisma.diet.create({
        data: {
            name,
            notes,
            meals: { create: mealsToCreate(meals) }
        },
        include
    })
}

// Encontra um modelo de dieta por seu id
export function findById(id: number) {
    return prisma.diet.findUnique({
        where: { id },
        include
    })
}

// Lista todos os modelos de dieta, em ordem alfabética
export function findAll() {
    return prisma.diet.findMany({
        orderBy: { name: "asc" },
        include
    })
}

// Atualiza um modelo de dieta; se houver refeições, substitui todas as anteriores
export function updateById(id: number, data: { name?: string; notes?: string | null; meals?: MealDto[] }) {
    return prisma.diet.update({
        where: { id },
        data: {
            name: data.name,
            notes: data.notes,
            ...(data.meals && {
                meals: {
                    deleteMany: {},
                    create: mealsToCreate(data.meals)
                }
            })
        },
        include
    })
}

// Exclui um modelo de dieta (as refeições são excluídas em cascata)
export function deleteById(id: number) {
    return prisma.diet.delete({
        where: { id },
        include
    })
}