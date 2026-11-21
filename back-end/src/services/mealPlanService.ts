import * as repository from "../repositories/mealPlanRepository"
import * as patientService from "./patientService"
import * as dietService from "./dietService"

import type { MealPlan } from "../../generated/prisma/client"
import type { MealDto } from "../dto/diet/createDietDto"
import type { CreateMealPlanDto } from "../dto/mealPlan/createMealPlanDto"
import type { UpdateMealPlanDto } from "../dto/mealPlan/updateMealPlanDto"

import { NotFoundError } from "../errors/NotFoundError"
import { BadRequestError } from "../errors/BadRequestError"

type MealPlanWithMeals = MealPlan & {
    meals: dietService.MealWithItems[];
    diet: { id: number; name: string } | null;
}

export type MealPlanResponse = Omit<MealPlanWithMeals, "meals"> & {
    meals: dietService.MealResponse[];
    totals: dietService.NutritionTotals;
}

function toResponse(plan: MealPlanWithMeals): MealPlanResponse {
    return { ...plan, ...dietService.mealsToResponse(plan.meals) }
}

// Copia as refeições de um modelo de dieta para o formato de criação
async function mealsFromDiet(dietId: number): Promise<MealDto[]> {
    const diet = await dietService.findById(dietId)

    return diet.meals.map(meal => ({
        name: meal.name,
        time: meal.time,
        items: meal.items.map(item => ({ foodId: item.foodId, quantity: item.quantity }))
    }))
}

function parseStartDate(value: Date | string | undefined): Date {
    const date = new Date(value ?? "")

    if (isNaN(date.getTime())) throw new BadRequestError("Informe a data de início do plano.")

    return date
}

export async function create(data: CreateMealPlanDto): Promise<MealPlanResponse> {
    // Garante que o paciente existe (404 caso contrário)
    await patientService.findById(Number(data.patientId))

    if (!data.name?.trim()) throw new BadRequestError("Informe o nome do plano.")

    const dietId = data.dietId ? Number(data.dietId) : null

    // Sem refeições no corpo da requisição, usa as do modelo escolhido
    let meals = data.meals
    if (meals === undefined && dietId) meals = await mealsFromDiet(dietId)
    else if (dietId) await dietService.findById(dietId)

    await dietService.validateMeals(meals)

    return toResponse(await repository.create(Number(data.patientId), {
        name: data.name.trim(),
        startDate: parseStartDate(data.startDate),
        notes: data.notes?.trim() || null,
        dietId
    }, meals!))
}

export async function findById(id: number): Promise<MealPlanResponse> {
    const plan = await repository.findById(id)

    if (!plan) throw new NotFoundError("Plano alimentar não encontrado.");

    return toResponse(plan)
}

export async function findAll(): Promise<MealPlanResponse[]> {
    const plans = await repository.findAll()

    return plans.map(toResponse)
}

export async function findAllByPatientId(patientId: number): Promise<MealPlanResponse[]> {
    // Retorna 404 se o paciente não existir, em vez de uma lista vazia
    await patientService.findById(patientId)

    const plans = await repository.findAllByPatientId(patientId)

    return plans.map(toResponse)
}

export async function updateById(id: number, data: UpdateMealPlanDto): Promise<MealPlanResponse> {
    await findById(id)

    if (data.name !== undefined && !data.name.trim()) throw new BadRequestError("Informe o nome do plano.")

    if (data.meals !== undefined) await dietService.validateMeals(data.meals)

    if (data.dietId) await dietService.findById(Number(data.dietId))

    return toResponse(await repository.updateById(id, {
        name: data.name?.trim(),
        startDate: data.startDate === undefined ? undefined : parseStartDate(data.startDate),
        notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
        dietId: data.dietId === undefined ? undefined : data.dietId ? Number(data.dietId) : null
    }, data.meals))
}

export async function deleteById(id: number): Promise<MealPlanResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}