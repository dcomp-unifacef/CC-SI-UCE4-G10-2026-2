import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

import { UnauthorizedError } from "../errors/UnauthorizedError"

export type TokenPayload = {
    sub: number;
    name: string;
}

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET

    if (!secret) throw new Error("JWT_SECRET não definida")

    return secret
}

// Verifica o token enviado no cabeçalho "Authorization: Bearer <token>".
// Sem token válido, a requisição é recusada com 401 e o front-end volta para o login.
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization

    if (!header?.startsWith("Bearer ")) {
        return next(new UnauthorizedError("Faça login para continuar."))
    }

    try {
        const payload = jwt.verify(header.slice(7), getJwtSecret()) as unknown as TokenPayload

        res.locals.userId = Number(payload.sub)

        next()
    } catch {
        next(new UnauthorizedError("Sessão expirada. Faça login novamente."))
    }
}