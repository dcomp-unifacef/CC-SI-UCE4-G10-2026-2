import * as repository from "../repositories/patientRepository"

import type { Patient } from "../../generated/prisma/client"
import type { CreatePatientDto } from "../dto/patient/createPatientDto"
import type { UpdatePatientDto } from "../dto/patient/updatePatientDto"

import { AppError } from "../errors/AppError"
import { NotFoundError } from "../errors/NotFoundError"

// Mantém apenas os dígitos do CPF, para que "000.000.000-00" e "00000000000" sejam o mesmo valor
function normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, "")
}

export async function create(data:CreatePatientDto): Promise<Patient> {
    // Regra de negócio: o paciente é cadastrado sem avaliações; elas são ligadas depois, em POST /body-assessments
    if ("assessments" in data) throw new AppError("Não é possível cadastrar um paciente com avaliações. Cadastre o paciente e depois registre as avaliações.", 400);

    return repository.create({ ...data, cpf: normalizeCpf(data.cpf) })
}

export async function findById(id: number): Promise<Patient> {
    const patient = await repository.findById(id)

    if(!patient) throw new NotFoundError("Paciente não encontrado.");
    
    return patient
}

export async function findAll(): Promise<Patient[]> {
    return repository.findAll()
}

export async function updateById(id: number, data: UpdatePatientDto): Promise<Patient> {
    await findById(id)

    if (data.cpf) data = { ...data, cpf: normalizeCpf(data.cpf) }

    return repository.updateById(id, data)
}

export async function deleteById(id: number): Promise<Patient> {
    await findById(id)

    return repository.deleteById(id)
}