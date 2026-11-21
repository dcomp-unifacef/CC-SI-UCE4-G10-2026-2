import * as repository from "../repositories/dietRepository"
import * as foodService from "./foodService"

import type { Diet, Meal, MealItem, Food } from "../../generated/prisma/client"
import type { CreateDietDto, MealDto } from "../dto/diet/createDietDto"
import type { UpdateDietDto } from "../dto/diet/updateDietDto"

import { NotFoundError } from "../errors/NotFoundError"
import { BadRequestError } from "../errors/BadRequestError"

// Totais de energia (kcal), macronutrientes e fibras (g)
export type NutritionTotals = {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
}

export type MealWithItems = Meal & { items: (MealItem & { food: Food })[] }

type DietWithMeals = Diet & {
    meals: MealWithItems[]
}

export type MealItemResponse = Omit<MealItem, "quantity"> & {
    quantity: number;
    food: foodService.FoodResponse;
    totals: NutritionTotals;
}

export type MealResponse = Omit<Meal, "items"> & {
    items: MealItemResponse[];
    totals: NutritionTotals;
}

export type DietResponse = Diet & {
    meals: MealResponse[];
    totals: NutritionTotals;
}

const emptyTotals = (): NutritionTotals => ({ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 })

const round1 = (value: number) => Math.round(value * 10) / 10

function sumTotals(list: NutritionTotals[]): NutritionTotals {
    const total = emptyTotals()

    for (const item of list) {
        total.calories += item.calories
        total.protein += item.protein
        total.carbohydrates += item.carbohydrates
        total.fat += item.fat
        total.fiber += item.fiber
    }

    return {
        calories: Math.round(total.calories),
        protein: round1(total.protein),
        carbohydrates: round1(total.carbohydrates),
        fat: round1(total.fat),
        fiber: round1(total.fiber)
    }
}

// Os valores do alimento são por porção; a quantidade da refeição é proporcional a ela
function itemTotals(food: foodService.FoodResponse, quantity: number): NutritionTotals {
    const factor = quantity / food.portionAmount

    return {
        calories: food.calories * factor,
        protein: food.protein * factor,
        carbohydrates: food.carbohydrates * factor,
        fat: food.fat * factor,
        fiber: food.fiber * factor
    }
}

// Converte as refeições (de um modelo ou de um plano) e calcula os totais de cada uma e do dia.
// Também usado pelo serviço de planos alimentares.
export function mealsToResponse(dbMeals: MealWithItems[]): { meals: MealResponse[]; totals: NutritionTotals } {
    const meals = dbMeals.map(meal => {
        const items = meal.items.map(item => {
            const food = foodService.toResponse(item.food)
            const quantity = item.quantity.toNumber()
            const totals = itemTotals(food, quantity)

            return { ...item, quantity, food, totals: sumTotals([totals]) }
        })

        return {
            ...meal,
            items,
            totals: sumTotals(items.map(item => itemTotals(item.food, item.quantity)))
        }
    })

    const allItems = meals.flatMap(meal => meal.items.map(item => itemTotals(item.food, item.quantity)))

    return { meals, totals: sumTotals(allItems) }
}

function toResponse(diet: DietWithMeals): DietResponse {
    return { ...diet, ...mealsToResponse(diet.meals) }
}

// Confere as refeições antes de gravar: nome, horário HH:MM, quantidades positivas e alimentos existentes
export async function validateMeals(meals: MealDto[] | undefined): Promise<void> {
    if (!Array.isArray(meals)) throw new BadRequestError("Informe as refeições do modelo.")

    for (const meal of meals) {
        if (!meal.name?.trim()) throw new BadRequestError("Toda refeição precisa de um nome.")

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(meal.time ?? "")) {
            throw new BadRequestError(`Horário inválido na refeição "${meal.name}". Use o formato HH:MM.`)
        }

        if (!Array.isArray(meal.items)) throw new BadRequestError(`Informe os alimentos da refeição "${meal.name}".`)

        for (const item of meal.items) {
            if (!(Number(item.quantity) > 0)) {
                throw new BadRequestError(`Informe uma quantidade maior que zero em "${meal.name}".`)
            }

            await foodService.findById(Number(item.foodId))
        }
    }
}

export async function create(data: CreateDietDto): Promise<DietResponse> {
    if (!data.name?.trim()) throw new BadRequestError("Informe o nome do modelo.")

    await validateMeals(data.meals)

    return toResponse(await repository.create(data.name.trim(), data.notes?.trim() || null, data.meals))
}

export async function findById(id: number): Promise<DietResponse> {
    const diet = await repository.findById(id)

    if (!diet) throw new NotFoundError("Modelo de dieta não encontrado.");

    return toResponse(diet)
}

export async function findAll(): Promise<DietResponse[]> {
    const diets = await repository.findAll()

    return diets.map(toResponse)
}

export async function updateById(id: number, data: UpdateDietDto): Promise<DietResponse> {
    await findById(id)

    if (data.meals !== undefined) await validateMeals(data.meals)

    return toResponse(await repository.updateById(id, {
        name: data.name?.trim(),
        notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
        meals: data.meals
    }))
}

export async function deleteById(id: number): Promise<DietResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}