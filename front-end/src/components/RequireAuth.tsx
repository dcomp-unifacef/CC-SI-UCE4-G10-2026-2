import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Só exibe as páginas internas para quem fez login; os demais voltam para a tela de login
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p role="status" className="p-4">Aguarde, carregando...</p>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}