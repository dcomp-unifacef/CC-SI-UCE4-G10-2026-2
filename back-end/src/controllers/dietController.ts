import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/dietService"

import type { CreateDietDto } from "../dto/diet/createDietDto"
import type { UpdateDietDto } from "../dto/diet/updateDietDto"

type DietIdParams = { id: string };

type CreateDietRequest = Request<
    Record<string, never>,
    unknown,
    CreateDietDto>;

type UpdateDietRequest = Request<
    DietIdParams,
    unknown,
    UpdateDietDto>;

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const diets = await service.findAll();

        res.json(diets);
    } catch (e) {
        next(e);
    }
}

export async function findById(req: Request<DietIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const diet = await service.findById(id);

        res.json(diet);
    } catch (e) {
        next(e);
    }
}

export async function create(req: CreateDietRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const diet = await service.create(req.body);

        res.status(201).json(diet);
    } catch(e) {
        next(e);
    }
}

export async function updateById(req: UpdateDietRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const diet = await service.updateById(id, req.body);

        res.json(diet);
    } catch(e) {
        next(e);
    }
}

export async function remove(req: Request<DietIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        await service.deleteById(id);

        res.status(204).end();
    } catch(e) {
        next(e);
    }
}