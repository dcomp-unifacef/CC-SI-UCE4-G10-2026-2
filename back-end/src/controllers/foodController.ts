import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/foodService"

import type { CreateFoodDto } from "../dto/food/createFoodDto"
import type { UpdateFoodDto } from "../dto/food/updateFoodDto"

type FoodIdParams = { id: string };

type CreateFoodRequest = Request<
    Record<string, never>,
    unknown,
    CreateFoodDto>;

type UpdateFoodRequest = Request<
    FoodIdParams,
    unknown,
    UpdateFoodDto>;

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const foods = await service.findAll();

        res.json(foods);
    } catch (e) {
        next(e);
    }
}

export async function findById(req: Request<FoodIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const food = await service.findById(id);

        res.json(food);
    } catch (e) {
        next(e);
    }
}

export async function create(req: CreateFoodRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const food = await service.create(req.body);

        res.status(201).json(food);
    } catch(e) {
        next(e);
    }
}

export async function updateById(req: UpdateFoodRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        const food = await service.updateById(id, req.body);

        res.json(food);
    } catch(e) {
        next(e);
    }
}

export async function remove(req: Request<FoodIdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = Number(req.params.id);

        await service.deleteById(id);

        res.status(204).end();
    } catch(e) {
        next(e);
    }
}