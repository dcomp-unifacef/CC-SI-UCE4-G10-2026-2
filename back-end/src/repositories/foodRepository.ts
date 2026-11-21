import { prisma } from "../database/client";

import type { CreateFoodDto } from "../dto/food/createFoodDto";

import type { UpdateFoodDto } from "../dto/food/updateFoodDto";

// Cria um novo alimento (sempre como cadastrado pela nutricionista, nunca da base padrão)
export function create(data: CreateFoodDto) {
    return prisma.food.create({
        data: { ...data, isDefault: false }
    })
}

// Encontra um alimento na tabela por seu id
export function findById(id: number) {
    return prisma.food.findUnique({
        where: { id }
    })
}

// Lista todos os alimentos, em ordem alfabética
export function findAll() {
    return prisma.food.findMany({
        orderBy: {
            name: "asc"
        }
    })
}

// Atualiza os dados de um alimento, buscando pelo id
export function updateById(id: number, data: UpdateFoodDto) {
    return prisma.food.update({
        where: { id },
        data
    })
}

// Exclui um alimento da tabela, buscando por seu id
export function deleteById(id: number) {
    return prisma.food.delete({
        where: { id }
    })
}