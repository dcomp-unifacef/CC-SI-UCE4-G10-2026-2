import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/mealPlanService"

import type { CreateMealPlanDto } from "../dto/mealPlan/createMealPlanDto"
import type { UpdateMealPlanDto } from "../dto/mealPlan/updateMealPlanDto"

type MealPlanIdParams = { id: string };

type PatientIdParams = { patientId: string };

type CreateMealPlanRequest = Request<
    Record<string, never>,
    unknown,
    CreateMealPlanDto>;

type UpdateMealPlanRequest = Request<
    MealPlanIdParams,
    unknown,
    UpdateMealPlanDto>;

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const plans = await service.findAll();

        res.json(plans);
    } catch (e) {
        next(e);
    }
}

export async function findById(req: Request<MealPlanIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const plan = await service.findById(id);

        res.json(plan);
    } catch (e) {
        next(e);
    }
}

export async function findAllByPatientId(req: Request<PatientIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const patientId = Number(req.params.patientId);

        const plans = await service.findAllByPatientId(patientId);

        res.json(plans);
    } catch (e) {
        next(e);
    }
}

export async function create(req: CreateMealPlanRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const plan = await service.create(req.body);

        res.status(201).json(plan);
    } catch(e) {
        next(e);
    }
}

export async function updateById(req: UpdateMealPlanRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const plan = await service.updateById(id, req.body);

        res.json(plan);
    } catch(e) {
        next(e);
    }
}

export async function remove(req: Request<MealPlanIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        await service.deleteById(id);

        res.status(204).end();
    } catch(e) {
        next(e);
    }
}