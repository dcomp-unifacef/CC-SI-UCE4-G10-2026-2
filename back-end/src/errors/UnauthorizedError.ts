import { AppError } from "./AppError";

export class UnauthorizedError extends AppError{
    constructor(message = 'Acesso não autorizado.') {
        super(message, 401)
        this.name = 'UnauthorizedError'
    }
}