// Endereço do back-end, definido no arquivo .env.local (VITE_API_BASE)
export const API_BASE = import.meta.env.VITE_API_BASE

const TOKEN_KEY = 'nutrisync.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Função para interpretar e dar mensagens de erro mais
// inteligíveis aos erros de fetch()
export async function getErrorMessage(response: Response) {
  const error = await response.json().catch(() => null)
  return error?.message || `A requisição falhou (HTTP ${response.status}).`
}

// Envoltório de fetch() que acrescenta o token de login no cabeçalho
// Authorization. Se o back-end responder 401 (token ausente ou expirado),
// o token é descartado e o usuário volta para a tela de login.
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 401) {
    clearToken()
    window.location.assign('/')
  }

  return response
}

// Atalho para requisições GET que devolvem JSON
export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiFetch(path)

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}