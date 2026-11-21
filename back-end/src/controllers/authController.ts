import {
    Request,
    Response,
    NextFunction
} from "express"

import * as service from "../services/authService"

import type { LoginDto } from "../dto/auth/loginDto"

type LoginRequest = Request<
    Record<string, never>,
    unknown,
    LoginDto>;

export async function login(req: LoginRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await service.login(req.body);

        res.json(result);
    } catch (e) {
        next(e);
    }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await service.me(res.locals.userId);

        res.json(user);
    } catch (e) {
        next(e);
    }
}