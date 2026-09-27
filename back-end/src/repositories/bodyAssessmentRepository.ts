import { prisma } from "../database/client";

import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto";

import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto";

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
        }
    })
}

// Encontra uma avaliação corporal na tabela por seu id
export function findById(id: number) {
    return prisma.bodyAssessment.findUnique({
        where: { id }
    })

}

// Lista todas as avaliações corporais da tabela, das mais recentes para as mais antigas
export function findAll() {
    return prisma.bodyAssessment.findMany({
        orderBy: {
            assessmentDate: "desc"
        }
    })

}

// Lista todas as avaliações corporais de um paciente, das mais recentes para as mais antigas
export function findAllByPatientId(patientId: number) {
    return prisma.bodyAssessment.findMany({
        where: { patientId },
        orderBy: {
            assessmentDate: "desc"
        }
    })

}

// Atualiza os dados de uma avaliação corporal, buscando pelo id
export function updateById(id: number, data: UpdateBodyAssessmentDto) {
    // Repassa apenas os campos do DTO, para que o patientId não possa ser alterado
    const { assessmentDate, weight, height, activityLevel } = data

    return prisma.bodyAssessment.update({
        where: { id },
        data: { assessmentDate, weight, height, activityLevel }
    })

}

// Exclui uma avaliação corporal da tabela, buscando por seu id
export function deleteById(id: number) {
    return prisma.bodyAssessment.delete({
        where: { id }
    })

}