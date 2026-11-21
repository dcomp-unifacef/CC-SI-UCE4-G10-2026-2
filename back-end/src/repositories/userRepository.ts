import { prisma } from "../database/client";

// Encontra um usuário pelo login (usado na autenticação)
export function findByLogin(login: string) {
    return prisma.user.findUnique({
        where: { login }
    })
}

// Encontra um usuário pelo id
export function findById(id: number) {
    return prisma.user.findUnique({
        where: { id }
    })
}