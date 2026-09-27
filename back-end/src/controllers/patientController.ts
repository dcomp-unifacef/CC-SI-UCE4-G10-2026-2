import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/patientService"

import type { CreatePatientDto } from "../dto/patient/createPatientDto"
import type { UpdatePatientDto } from "../dto/patient/updatePatientDto"

type PatientIdParams = { id: string };

type CreatePatientRequest = Request<
    Record<string, never>,
    unknown,
    CreatePatientDto>;

type UpdatePatientRequest = Request<
    PatientIdParams,
    unknown,
    UpdatePatientDto>;

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const patient = await service.findAll();

        res.json(patient);
    } catch (e) {
        next(e);
    }
}

export async function findById(req: Request<PatientIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const patient = await service.findById(id);

        res.json(patient);
    } catch (e) {
        next(e);
    }
}

export async function create(req: CreatePatientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const patient = await service.create(req.body);

        res.status(201).json(patient);
    } catch(e) {
        next(e);
    }
}

export async function updateById(req: UpdatePatientRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const patient = await service.updateById(id, req.body);

        res.json(patient);
    } catch(e) {
        next(e);
    }
}

export async function remove(req: Request<PatientIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        await service.deleteById(id);

        res.status(204).end();
    } catch(e){
        next(e)
    }
}