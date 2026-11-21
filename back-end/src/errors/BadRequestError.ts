import { AppError } from "./AppError";

export class BadRequestError extends AppError{
    constructor(message = 'Requisição inválida.') {
        super(message, 400)
        this.name = 'BadRequestError'
    }
}