import type { Meal, NutritionTotals } from '../types/Diet'
import type { Food } from '../types/Food'

// Estado do editor de refeições: campos como string; "key" identifica cada linha na tela.
// Usado tanto nos modelos de dieta quanto nos planos alimentares dos pacientes.
export type ItemForm = { key: number; foodId: string; quantity: string }
export type MealForm = { key: number; name: string; time: string; items: ItemForm[] }

let nextKey = 1
export const newItem = (): ItemForm => ({ key: nextKey++, foodId: '', quantity: '' })
export const newMeal = (name = '', time = ''): MealForm => ({ key: nextKey++, name, time, items: [newItem()] })

export const defaultMeals = () => [newMeal('Café da manhã', '07:00'), newMeal('Almoço', '12:00')]

// Refeições vindas do back-end ~> estado do formulário
export function mealsFromApi(meals: Meal[]): MealForm[] {
  return meals.map(meal => ({
    key: nextKey++,
    name: meal.name,
    time: meal.time,
    items: meal.items.map(item => ({
      key: nextKey++,
      foodId: item.foodId.toString(),
      quantity: item.quantity.toString(),
    })),
  }))
}

// Estado do formulário ~> formato esperado pelo back-end.
// Refeições em ordem de horário; linhas sem alimento escolhido são ignoradas.
export function mealsToPayload(meals: MealForm[]) {
  return [...meals]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map(meal => ({
      name: meal.name.trim(),
      time: meal.time,
      items: meal.items
        .filter(item => item.foodId)
        .map(item => ({ foodId: Number(item.foodId), quantity: Number(item.quantity) })),
    }))
}

export const emptyTotals = (): NutritionTotals => ({ calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 })

// Valores do alimento são por porção; a quantidade informada é proporcional a ela
export function itemTotals(food: Food | undefined, quantity: string): NutritionTotals {
  const amount = Number(quantity)
  if (!food || !(amount > 0)) return emptyTotals()

  const factor = amount / food.portionAmount
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbohydrates: food.carbohydrates * factor,
    fat: food.fat * factor,
    fiber: food.fiber * factor,
  }
}

export function sumTotals(list: NutritionTotals[]): NutritionTotals {
  return list.reduce((total, item) => ({
    calories: total.calories + item.calories,
    protein: total.protein + item.protein,
    carbohydrates: total.carbohydrates + item.carbohydrates,
    fat: total.fat + item.fat,
    fiber: total.fiber + item.fiber,
  }), emptyTotals())
}

// Totais de cada refeição e do dia inteiro
export function calculateTotals(meals: MealForm[], foods: Food[]) {
  const foodById = (foodId: string) => foods.find(food => food.id === Number(foodId))

  const mealTotals = meals.map(meal =>
    sumTotals(meal.items.map(item => itemTotals(foodById(item.foodId), item.quantity)))
  )

  return { mealTotals, total: sumTotals(mealTotals) }
}