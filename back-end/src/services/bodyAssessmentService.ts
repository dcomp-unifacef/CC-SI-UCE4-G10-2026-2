import * as repository from "../repositories/bodyAssessmentRepository"
import * as patientService from "./patientService"

import type { BodyAssessment } from "../../generated/prisma/client"
import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto"
import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto"

import { NotFoundError } from "../errors/NotFoundError"

// Avaliação com peso e altura como number, pois o Decimal do Prisma é serializado como string no JSON
export type BodyAssessmentResponse = Omit<BodyAssessment, "weight" | "height"> & {
    weight: number;
    height: number;
}

function toResponse(assessment: BodyAssessment): BodyAssessmentResponse {
    return {
        ...assessment,
        weight: assessment.weight.toNumber(),
        height: assessment.height.toNumber()
    }
}

export async function create(data: CreateBodyAssessmentDto): Promise<BodyAssessmentResponse> {
    // Verifica se o paciente existe antes de registrar a avaliação
    await patientService.findById(data.patientId)

    return toResponse(await repository.create(data))
}

export async function findById(id: number): Promise<BodyAssessmentResponse> {
    const assessment = await repository.findById(id)

    if(!assessment) throw new NotFoundError("Avaliação corporal não encontrada.");

    return toResponse(assessment)
}

export async function findAll(): Promise<BodyAssessmentResponse[]> {
    const assessments = await repository.findAll()

    return assessments.map(toResponse)
}

export async function findAllByPatientId(patientId: number): Promise<BodyAssessmentResponse[]> {
    // Retorna 404 se o paciente não existir, em vez de uma lista vazia
    await patientService.findById(patientId)

    const assessments = await repository.findAllByPatientId(patientId)

    return assessments.map(toResponse)
}

export async function updateById(id: number, data: UpdateBodyAssessmentDto): Promise<BodyAssessmentResponse> {
    await findById(id)

    return toResponse(await repository.updateById(id, data))
}

export async function deleteById(id: number): Promise<BodyAssessmentResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}