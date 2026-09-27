import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/bodyAssessmentService"

import type { CreateBodyAssessmentDto } from "../dto/bodyAssessment/createBodyAssessmentDto"
import type { UpdateBodyAssessmentDto } from "../dto/bodyAssessment/updateBodyAssessmentDto"

type BodyAssessmentIdParams = { id: string };

type PatientIdParams = { patientId: string };

type CreateBodyAssessmentRequest = Request<
    Record<string, never>,
    unknown,
    CreateBodyAssessmentDto>;

type UpdateBodyAssessmentRequest = Request<
    BodyAssessmentIdParams,
    unknown,
    UpdateBodyAssessmentDto>;

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const assessments = await service.findAll();

        res.json(assessments);
    } catch (e) {
        next(e);
    }
}

export async function findById(req: Request<BodyAssessmentIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const assessment = await service.findById(id);

        res.json(assessment);
    } catch (e) {
        next(e);
    }
}

export async function findAllByPatientId(req: Request<PatientIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const patientId = Number(req.params.patientId);

        const assessments = await service.findAllByPatientId(patientId);

        res.json(assessments);
    } catch (e) {
        next(e);
    }
}

export async function create(req: CreateBodyAssessmentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const assessment = await service.create(req.body);

        res.status(201).json(assessment);
    } catch(e) {
        next(e);
    }
}

export async function updateById(req: UpdateBodyAssessmentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const assessment = await service.updateById(id, req.body);

        res.json(assessment);
    } catch(e) {
        next(e);
    }
}

export async function remove(req: Request<BodyAssessmentIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        await service.deleteById(id);

        res.status(204).end();
    } catch(e) {
        next(e);
    }
}