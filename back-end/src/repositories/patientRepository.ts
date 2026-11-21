import { prisma } from "../database/client";

import type { CreatePatientDto } from "../dto/patient/createPatientDto";

import type { UpdatePatientDto } from "../dto/patient/updatePatientDto";

// Inclui apenas a avaliação corporal mais recente, usada para calcular IMC, GET e água
const includeLatestAssessment = {
    assessments: {
        orderBy: { assessmentDate: "desc" as const },
        take: 1
    }
}

// Crie um novo registro de paciente
export function create(data: CreatePatientDto) {
    // Repassa apenas os campos do DTO, impedindo que id, datas de controle ou
    // avaliações sejam enviados
    const { name, birthDate, gender, biologicalSex, cpf, phone, active } = data
    return prisma.patient.create({
        data: { name, birthDate, gender, biologicalSex, cpf, phone, active }
    })
}

// Encontra um paciente na tabela por seu id
export function findById(id: number) {
    return prisma.patient.findUnique({
        where: { id },
        include: includeLatestAssessment
    })

}


// Lista todos os pacientes da tabela
export function findAll() {
    return prisma.patient.findMany({
        orderBy: {
            name: "asc"
        },
        include: includeLatestAssessment
    })

}


// Atualiza os dados de um paciente, buscando pelo id
export function updateById(id: number, data: UpdatePatientDto) {
    // Repassa apenas os campos do DTO, para que o id, as datas de controle e 
    // as avaliações não possam ser alterados diretamente
    const { name, birthDate, gender, biologicalSex, cpf, phone, active } = data
    return prisma.patient.update({
        where: { id },
        data: { name, birthDate, gender, biologicalSex, cpf, phone, active }
    })
}


// Exclui um paciente da tabela, buscando por seu id
export function deleteById(id: number) {
    return prisma.patient.delete({
        where: { id }
    })

}