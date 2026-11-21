import * as repository from "../repositories/bodyAssessmentRepository"
import * as patientService from "./patientService"

import type { BodyAssessment, BiologicalSex } from "../../generated/prisma/client"
import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto"
import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto"

import { NotFoundError } from "../errors/NotFoundError"
import { BadRequestError } from "../errors/BadRequestError"
import { calculateAge, calculateAnthropometry, type AnthropometricResult } from "../utils/anthropometry"

type AssessmentWithPatient = BodyAssessment & {
    patient: { id: number; name: string; birthDate: Date; biologicalSex: BiologicalSex }
}

// Avaliação com peso e altura como number (o Decimal do Prisma é serializado como string no JSON),
// a idade na data da avaliação e os indicadores calculados (IMC, água, TMB e GET)
export type BodyAssessmentResponse = Omit<BodyAssessment, "weight" | "height"> & AnthropometricResult & {
    weight: number;
    height: number;
    age: number;
    patient: { id: number; name: string };
}

function toResponse({ patient, ...assessment }: AssessmentWithPatient): BodyAssessmentResponse {
    const weight = assessment.weight.toNumber()
    const height = assessment.height.toNumber()
    const age = calculateAge(patient.birthDate, assessment.assessmentDate)

    return {
        ...assessment,
        weight,
        height,
        age,
        patient: { id: patient.id, name: patient.name },
        ...calculateAnthropometry(weight, height, age, patient.biologicalSex, assessment.activityLevel)
    }
}

// Confere peso (kg) e altura (m) antes de gravar
function validateMeasures(data: { weight?: number; height?: number }) {
    if (data.weight !== undefined && !(Number(data.weight) > 0 && Number(data.weight) < 1000)) {
        throw new BadRequestError("Informe um peso válido, em kg.")
    }

    if (data.height !== undefined && !(Number(data.height) > 0.3 && Number(data.height) < 2.8)) {
        throw new BadRequestError("Informe a altura em metros (ex.: 1,65).")
    }
}

// Cada paciente pode ter apenas uma avaliação por data
async function ensureDateIsFree(patientId: number, date: Date | string, currentId?: number) {
    const assessmentDate = new Date(date)

    if (isNaN(assessmentDate.getTime())) throw new BadRequestError("Informe a data da avaliação.")

    const existing = await repository.findByPatientAndDate(patientId, assessmentDate)

    if (existing && existing.id !== currentId) {
        throw new BadRequestError("Este paciente já tem uma avaliação registrada nesta data.")
    }
}

export async function create(data: CreateBodyAssessmentDto): Promise<BodyAssessmentResponse> {
    // Verifica se o paciente existe antes de registrar a avaliação
    await patientService.findById(data.patientId)

    validateMeasures(data)
    await ensureDateIsFree(data.patientId, data.assessmentDate)

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
    const current = await findById(id)

    validateMeasures(data)
    if (data.assessmentDate) await ensureDateIsFree(current.patientId, data.assessmentDate, id)

    return toResponse(await repository.updateById(id, data))
}

export async function deleteById(id: number): Promise<BodyAssessmentResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}