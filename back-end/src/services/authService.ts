import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import * as repository from "../repositories/userRepository"

import type { User } from "../../generated/prisma/client"
import type { LoginDto } from "../dto/auth/loginDto"

import { BadRequestError } from "../errors/BadRequestError"
import { UnauthorizedError } from "../errors/UnauthorizedError"
import { NotFoundError } from "../errors/NotFoundError"
import { getJwtSecret } from "../middlewares/auth"

// Dados do usuário devolvidos ao front-end (sem o hash da senha)
export type UserResponse = Omit<User, "passwordHash">

export type LoginResponse = {
    token: string;
    user: UserResponse;
}

function toResponse({ passwordHash: _passwordHash, ...user }: User): UserResponse {
    return user
}

export async function login(data: LoginDto): Promise<LoginResponse> {
    if (!data?.login || !data?.password) {
        throw new BadRequestError("Informe o login e a senha.")
    }

    const user = await repository.findByLogin(data.login.trim())

    // Mesma mensagem para login inexistente e senha errada, para não revelar quais logins existem
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
        throw new UnauthorizedError("Login ou senha incorretos.")
    }

    const token = jwt.sign({ name: user.name }, getJwtSecret(), {
        subject: String(user.id),
        expiresIn: "8h"
    })

    return { token, user: toResponse(user) }
}

export async function me(userId: number): Promise<UserResponse> {
    const user = await repository.findById(userId)

    if (!user) throw new NotFoundError("Usuário não encontrado.")

    return toResponse(user)
}