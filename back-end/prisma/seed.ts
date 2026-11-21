// Dados iniciais para demonstração (todos fictícios).
// Execute com: npx prisma db seed
import bcrypt from "bcryptjs"

import { prisma } from "../src/database/client"
import type { MeasureUnit } from "../generated/prisma/client"

// Usuário de acesso à aplicação
const demoUser = {
    name: "Nutricionista Teste",
    login: "nutri",
    password: "nutri123"
}

// Base padrão de alimentos: valores por porção de referência
const foods: [string, number, MeasureUnit, string | null, number, number, number, number, number][] = [
    // nome, porção, unidade, descrição da porção, kcal, proteína, carboidrato, gordura, fibras
    ["Arroz branco cozido", 100, "G", null, 128, 2.5, 28.1, 0.2, 1.6],
    ["Feijão carioca cozido", 100, "G", null, 76, 4.8, 13.6, 0.5, 8.5],
    ["Peito de frango grelhado", 100, "G", null, 159, 32.0, 0.0, 2.5, 0.0],
    ["Ovo cozido", 50, "G", "1 unidade", 72, 6.3, 0.4, 4.8, 0.0],
    ["Batata doce cozida", 100, "G", null, 77, 0.6, 18.4, 0.1, 2.2],
    ["Aveia em flocos", 30, "G", null, 117, 4.1, 20.0, 2.3, 2.8],
    ["Banana prata", 100, "G", null, 98, 1.3, 26.0, 0.1, 2.0],
    ["Leite desnatado", 200, "ML", null, 70, 6.8, 9.8, 0.4, 0.0],
    ["Iogurte natural integral", 170, "G", null, 88, 7.1, 6.6, 4.2, 0.0],
    ["Azeite de oliva extra virgem", 10, "ML", null, 88, 0.0, 0.0, 10.0, 0.0],
    ["Brócolis cozido", 100, "G", null, 25, 2.1, 4.4, 0.5, 3.4],
    ["Salmão grelhado", 100, "G", null, 208, 22.5, 0.0, 13.4, 0.0],
    ["Pão integral", 50, "G", null, 127, 5.1, 22.5, 1.9, 3.4],
    ["Whey protein concentrado", 30, "G", null, 120, 24.0, 3.0, 1.5, 0.0],
    ["Castanha do Pará", 20, "G", null, 129, 2.8, 2.4, 13.1, 1.6],
]

// Pacientes de exemplo, cada um com uma avaliação corporal
const patients = [
    {
        name: "Marina Duarte", birthDate: "1992-03-10", gender: "Feminino", biologicalSex: "FEMININO" as const,
        cpf: "12345678900", phone: "(11) 98888-7777", active: true,
        assessment: { assessmentDate: "2026-07-20", weight: 72.3, height: 1.65, activityLevel: "MODERADAMENTE_ATIVO" as const }
    },
    {
        name: "Rafael Nogueira", birthDate: "1987-01-15", gender: "Masculino", biologicalSex: "MASCULINO" as const,
        cpf: "98765432100", phone: "(11) 97777-6666", active: true,
        assessment: { assessmentDate: "2026-06-28", weight: 85.2, height: 1.81, activityLevel: "MUITO_ATIVO" as const }
    },
    {
        name: "Beatriz Camargo", birthDate: "1998-09-05", gender: "Feminino", biologicalSex: "FEMININO" as const,
        cpf: "45612378900", phone: "(21) 95555-4444", active: false,
        assessment: { assessmentDate: "2026-02-14", weight: 61.2, height: 1.58, activityLevel: "SEDENTARIO" as const }
    },
]

// Avaliações anteriores (histórico), por CPF do paciente
const previousAssessments = [
    { cpf: "12345678900", assessmentDate: "2026-04-15", weight: 75.0, height: 1.65, activityLevel: "LIGEIRAMENTE_ATIVO" as const },
    { cpf: "98765432100", assessmentDate: "2026-03-10", weight: 83.1, height: 1.81, activityLevel: "MUITO_ATIVO" as const },
]

// Planos alimentares atribuídos: [CPF do paciente, modelo de origem, data de início]
const mealPlans: [string, string, string][] = [
    ["12345678900", "Emagrecimento", "2026-07-20"],
    ["98765432100", "Hipertrofia", "2026-06-28"],
]

// Modelos de dieta: refeições com [alimento, quantidade em g ou ml]
const diets = [
    {
        name: "Hipertrofia",
        notes: "Distribuir a proteína ao longo do dia. Refeição pré-treino 90 minutos antes.",
        meals: [
            { time: "07:00", name: "Café da manhã", items: [["Aveia em flocos", 60], ["Leite desnatado", 200], ["Banana prata", 100]] },
            { time: "12:00", name: "Almoço", items: [["Arroz branco cozido", 150], ["Feijão carioca cozido", 100], ["Peito de frango grelhado", 180]] },
            { time: "18:30", name: "Pós-treino", items: [["Whey protein concentrado", 30], ["Banana prata", 100]] },
        ]
    },
    {
        name: "Emagrecimento",
        notes: "Priorizar vegetais no almoço e manter boa hidratação.",
        meals: [
            { time: "07:30", name: "Café da manhã", items: [["Ovo cozido", 100], ["Pão integral", 50]] },
            { time: "12:30", name: "Almoço", items: [["Salmão grelhado", 100], ["Brócolis cozido", 100]] },
        ]
    },
]

const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`)

async function main() {
    await prisma.user.upsert({
        where: { login: demoUser.login },
        update: {},
        create: {
            name: demoUser.name,
            login: demoUser.login,
            passwordHash: await bcrypt.hash(demoUser.password, 10)
        }
    })

    const foodIds = new Map<string, number>()

    for (const [name, portionAmount, portionUnit, portionNote, calories, protein, carbohydrates, fat, fiber] of foods) {
        const food = await prisma.food.upsert({
            where: { name },
            update: {},
            create: { name, portionAmount, portionUnit, portionNote, calories, protein, carbohydrates, fat, fiber, isDefault: true }
        })

        foodIds.set(name, food.id)
    }

    for (const { assessment, birthDate, ...patient } of patients) {
        const exists = await prisma.patient.findUnique({ where: { cpf: patient.cpf } })

        if (exists) continue

        await prisma.patient.create({
            data: {
                ...patient,
                birthDate: toDate(birthDate),
                assessments: {
                    create: { ...assessment, assessmentDate: toDate(assessment.assessmentDate) }
                }
            }
        })
    }

    for (const diet of diets) {
        const exists = await prisma.diet.findUnique({ where: { name: diet.name } })

        if (exists) continue

        await prisma.diet.create({
            data: {
                name: diet.name,
                notes: diet.notes,
                meals: {
                    create: diet.meals.map((meal, position) => ({
                        time: meal.time,
                        name: meal.name,
                        position,
                        items: {
                            create: meal.items.map(([foodName, quantity]) => ({
                                foodId: foodIds.get(foodName as string)!,
                                quantity: quantity as number
                            }))
                        }
                    }))
                }
            }
        })
    }

    for (const { cpf, assessmentDate, ...assessment } of previousAssessments) {
        const patient = await prisma.patient.findUnique({ where: { cpf } })

        if (!patient) continue

        const date = toDate(assessmentDate)

        await prisma.bodyAssessment.upsert({
            where: { patientId_assessmentDate: { patientId: patient.id, assessmentDate: date } },
            update: {},
            create: { ...assessment, assessmentDate: date, patientId: patient.id }
        })
    }

    for (const [cpf, dietName, startDate] of mealPlans) {
        const patient = await prisma.patient.findUnique({ where: { cpf } })
        const diet = await prisma.diet.findUnique({
            where: { name: dietName },
            include: { meals: { orderBy: { position: "asc" }, include: { items: true } } }
        })

        if (!patient || !diet) continue

        // Só cria o plano se o paciente ainda não tiver nenhum
        if (await prisma.mealPlan.count({ where: { patientId: patient.id } }) > 0) continue

        // As refeições do modelo são copiadas para o plano do paciente
        await prisma.mealPlan.create({
            data: {
                name: `${diet.name} · ${patient.name.split(" ")[0]}`,
                startDate: toDate(startDate),
                notes: diet.notes,
                patientId: patient.id,
                dietId: diet.id,
                meals: {
                    create: diet.meals.map(meal => ({
                        name: meal.name,
                        time: meal.time,
                        position: meal.position,
                        items: { create: meal.items.map(item => ({ foodId: item.foodId, quantity: item.quantity })) }
                    }))
                }
            }
        })
    }

    console.log(`Seed concluído. Acesse com login "${demoUser.login}" e senha "${demoUser.password}".`)
}

main()
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())