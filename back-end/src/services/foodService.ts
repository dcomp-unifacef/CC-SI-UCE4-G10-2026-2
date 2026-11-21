import * as repository from "../repositories/foodRepository"

import type { Food } from "../../generated/prisma/client"
import type { CreateFoodDto } from "../dto/food/createFoodDto"
import type { UpdateFoodDto } from "../dto/food/updateFoodDto"

import { NotFoundError } from "../errors/NotFoundError"

type DecimalField = "portionAmount" | "calories" | "protein" | "carbohydrates" | "fat" | "fiber"

// Alimento com os campos Decimal convertidos para number, pois o Decimal do Prisma é serializado como string no JSON
export type FoodResponse = Omit<Food, DecimalField> & Record<DecimalField, number>

export function toResponse(food: Food): FoodResponse {
    return {
        ...food,
        portionAmount: food.portionAmount.toNumber(),
        calories: food.calories.toNumber(),
        protein: food.protein.toNumber(),
        carbohydrates: food.carbohydrates.toNumber(),
        fat: food.fat.toNumber(),
        fiber: food.fiber.toNumber()
    }
}

// Remove espaços extras do nome e transforma descrição vazia em null
function normalize<T extends UpdateFoodDto>(data: T): T {
    return {
        ...data,
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.portionNote !== undefined && { portionNote: data.portionNote?.trim() || null })
    }
}

export async function create(data: CreateFoodDto): Promise<FoodResponse> {
    return toResponse(await repository.create(normalize(data)))
}

export async function findById(id: number): Promise<FoodResponse> {
    const food = await repository.findById(id)

    if (!food) throw new NotFoundError("Alimento não encontrado.");

    return toResponse(food)
}

export async function findAll(): Promise<FoodResponse[]> {
    const foods = await repository.findAll()

    return foods.map(toResponse)
}

export async function updateById(id: number, data: UpdateFoodDto): Promise<FoodResponse> {
    await findById(id)

    return toResponse(await repository.updateById(id, normalize(data)))
}

export async function deleteById(id: number): Promise<FoodResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}