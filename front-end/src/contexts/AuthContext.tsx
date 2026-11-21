import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/User'
import { API_BASE, apiGet, clearToken, getErrorMessage, getToken, saveToken } from '../utils/api'

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Guarda o usuário logado e disponibiliza login() e logout() para
// todos os componentes da aplicação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Começa "carregando" apenas se houver um token salvo a ser conferido
  const [loading, setLoading] = useState(() => getToken() !== null)

  // Ao abrir a aplicação, se houver um token salvo, busca os dados do
  // usuário para confirmar que a sessão ainda é válida
  useEffect(() => {
    if (!getToken()) return

    let active = true

    apiGet<User>('/auth/me')
      .then(result => { if (active) setUser(result) })
      .catch(() => { if (active) clearToken() })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
    }
  }, [])

  async function login(login: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response))
    }

    const result: { token: string; user: User } = await response.json()

    saveToken(result.token)
    setUser(result.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) throw new Error('useAuth() deve ser usado dentro de <AuthProvider>')

  return context
}