import { prisma } from "../database/client";

import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto";

import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto";

// Dados do paciente necessários para calcular os indicadores (idade e sexo biológico)
const include = {
    patient: {
        select: { id: true, name: true, birthDate: true, biologicalSex: true }
    }
}

// Cria um novo registro de avaliação corporal, ligando-o a um paciente já cadastrado
export function create(data: CreateBodyAssessmentDto) {
    const { patientId, assessmentDate, weight, height, activityLevel } = data
    return prisma.bodyAssessment.create({
        data: {
            assessmentDate,
            weight,
            height,
            activityLevel,
            patient: { connect: { id: patientId } }
        },
        include
    })
}

// Encontra uma avaliação corporal na tabela por seu id
export function findById(id: number) {
    return prisma.bodyAssessment.findUnique({
        where: { id },
        include
    })
}


// Lista todas as avaliações corporais da tabela, das mais recentes para as mais antigas
export function findAll() {
    return prisma.bodyAssessment.findMany({
        orderBy: {
            assessmentDate: "desc"
        },
        include
    })
}


// Lista todas as avaliações corporais de um paciente, das mais recentes para as mais antigas
export function findAllByPatientId(patientId: number) {
    return prisma.bodyAssessment.findMany({
        where: { patientId },
        orderBy: {
            assessmentDate: "desc"
        },
        include
    })
}


// Atualiza os dados de uma avaliação corporal, buscando pelo id
export function updateById(id: number, data: UpdateBodyAssessmentDto) {
    // Repassa apenas os campos do DTO, para que o patientId não possaser alterado
    const { assessmentDate, weight, height, activityLevel } = data
    return prisma.bodyAssessment.update({
        where: { id },
        data: { assessmentDate, weight, height, activityLevel },
        include
    })
}


// Exclui uma avaliação corporal da tabela, buscando por seu id
export function deleteById(id: number) {
    return prisma.bodyAssessment.delete({
        where: { id },
        include
    })
}


// Encontra a avaliação de um paciente em uma data (cada paciente tem no máximo uma por dia)
export function findByPatientAndDate(patientId: number, assessmentDate: Date) {
    return prisma.bodyAssessment.findUnique({
        where: { patientId_assessmentDate: { patientId, assessmentDate } }
    })
}