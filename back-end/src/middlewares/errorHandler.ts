import type { Request, Response, NextFunction } from "express"

import { AppError } from "../errors/AppError"
import { Prisma } from "../../generated/prisma/client"

// Middleware de tratamento de erros: transforma as exceções lançadas nas rotas
// em respostas JSON no formato { message }, que o front-end exibe ao usuário.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message })
        return
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            // Violação de campo único (ex.: CPF ou nome de alimento repetido)
            case "P2002":
                res.status(409).json({ message: "Já existe um registro cadastrado com esse valor." })
                return
            // Registro relacionado em uso (ex.: alimento usado em um modelo de dieta)
            case "P2003":
                res.status(409).json({ message: "O registro está em uso e não pode ser excluído." })
                return
            case "P2025":
                res.status(404).json({ message: "Recurso não encontrado." })
                return
        }
    }

    // Dados com tipo ou formato inválido (ex.: data mal formatada, valor fora do enum)
    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({ message: "Dados inválidos. Verifique os campos informados." })
        return
    }

    console.error(err)
    res.status(500).json({ message: "Erro interno do servidor." })
}