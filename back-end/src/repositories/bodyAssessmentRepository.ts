import { prisma } from "../database/client";

import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto";

import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto";

// Cria um novo registro de avaliação corporal
export function create(data: CreateBodyAssessmentDto) {
    return prisma.bodyAssessment.create({
        data
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
    return prisma.bodyAssessment.update({
        where: { id },
        data
    })

}

// Exclui uma avaliação corporal da tabela, buscando por seu id
export function deleteById(id: number) {
    return prisma.bodyAssessment.delete({
        where: { id }
    })

}
git add .
