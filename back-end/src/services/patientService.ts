import * as repository from "../repositories/patientRepository"

import type { Patient, BodyAssessment } from "../../generated/prisma/client"
import type { CreatePatientDto } from "../dto/patient/createPatientDto"
import type { UpdatePatientDto } from "../dto/patient/updatePatientDto"

import { AppError } from "../errors/AppError"
import { NotFoundError } from "../errors/NotFoundError"
import { calculateAge, calculateAnthropometry, type AnthropometricResult } from "../utils/anthropometry"

// Resumo da avaliação mais recente, com os indicadores já calculados
export type LatestAssessment = AnthropometricResult & {
    id: number;
    assessmentDate: Date;
    weight: number;
    height: number;
    activityLevel: BodyAssessment["activityLevel"];
}

// Paciente com a idade e o resumo da última avaliação, usados nas listagens e no painel
export type PatientResponse = Patient & {
    age: number;
    latestAssessment: LatestAssessment | null;
}

type PatientWithAssessments = Patient & { assessments?: BodyAssessment[] }

function toResponse({ assessments, ...patient }: PatientWithAssessments): PatientResponse {
    const age = calculateAge(patient.birthDate)
    const latest = assessments?.[0]

    let latestAssessment: LatestAssessment | null = null

    if (latest) {
        const weight = latest.weight.toNumber()
        const height = latest.height.toNumber()
        // A idade usada no cálculo é a da data da avaliação
        const ageAtAssessment = calculateAge(patient.birthDate, latest.assessmentDate)

        latestAssessment = {
            id: latest.id,
            assessmentDate: latest.assessmentDate,
            weight,
            height,
            activityLevel: latest.activityLevel,
            ...calculateAnthropometry(weight, height, ageAtAssessment, patient.biologicalSex, latest.activityLevel)
        }
    }

    return { ...patient, age, latestAssessment }
}

// Mantém apenas os dígitos do CPF, para que "000.000.000-00" e "00000000000" sejam o mesmo valor
function normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, "")
}

export async function create(data:CreatePatientDto): Promise<PatientResponse> {
    // Regra de negócio: o paciente é cadastrado sem avaliações; elas são ligadas depois, em POST /body-assessments
    if ("assessments" in data) throw new AppError(
        "Não é possível cadastrar um paciente com avaliações. Cadastre o paciente e depois registre as avaliações.",
        400);

    return toResponse(await repository.create({ ...data, cpf: normalizeCpf(data.cpf) }))
}

export async function findById(id: number): Promise<PatientResponse> {
    const patient = await repository.findById(id)

    if(!patient) throw new NotFoundError("Paciente não encontrado.");
    
    return toResponse(patient)
}

export async function findAll(): Promise<PatientResponse[]> {
    const patients = await repository.findAll()

    return patients.map(toResponse)
}

export async function updateById(id: number, data: UpdatePatientDto): Promise<PatientResponse> {
    await findById(id)

    if (data.cpf) data = { ...data, cpf: normalizeCpf(data.cpf) }

    return toResponse(await repository.updateById(id, data))
}

export async function deleteById(id: number): Promise<PatientResponse> {
    await findById(id)

    return toResponse(await repository.deleteById(id))
}