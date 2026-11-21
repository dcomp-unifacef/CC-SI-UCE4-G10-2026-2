import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useDialog } from '../contexts/DialogContext'
import { Icon, Logo } from './Icon'

export function Login() {
  const { showAlert } = useDialog()
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [credentials, setCredentials] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Quem já está logado vai direto para o painel
  if (user) return <Navigate to="/dashboard" replace />

  function handleFieldChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setCredentials(previous => ({ ...previous, [name]: value }))
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage('')

    try {
      await login(credentials.login, credentials.password)
      navigate('/dashboard')
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido.')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="ns-login">
      <section className="ns-login-hero">
        <div className="d-flex align-items-center gap-2 mb-5">
          <Logo size={56} />
          <div className="lh-sm">
            <div className="fw-bold fs-5">NutriSync</div>
            <div className="ns-brand-sub">Clínica Nutricional</div>
          </div>
        </div>

        <div className="my-auto">
          <h2 className="mb-4">Menos conta na calculadora, mais tempo com o paciente.</h2>
          <ul className="list-unstyled mb-0">
            <li><Icon name="check" />IMC, água, TMB e GET calculados na hora da avaliação</li>
            <li><Icon name="check" />Planos alimentares a partir de modelos, com totais em tempo real</li>
            <li><Icon name="check" />PDF do plano pronto para enviar ao paciente</li>
          </ul>
        </div>

        <p className="ns-brand-sub mb-0 mt-5">Projeto UNIFACEF · 2026</p>
      </section>

      <section className="ns-login-form">
        <form onSubmit={handleFormSubmit}>
          <div className="d-flex align-items-center gap-2 mb-4 d-lg-none">
            <Logo />
            <span className="fw-bold fs-5">NutriSync</span>
          </div>

          <h1 className="h2 mb-1">Entrar</h1>
          <p className="text-secondary mb-4">Acesse com seu login de nutricionista.</p>

          {errorMessage && (
            <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>
          )}

          <fieldset disabled={loading}>
            <div className="mb-3">
              <label htmlFor="login" className="form-label">Login</label>
              <input
                id="login"
                name="login"
                type="text"
                className="form-control form-control-lg"
                autoComplete="username"
                required
                autoFocus
                value={credentials.login}
                onChange={handleFieldChange}
              />
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="form-label">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control form-control-lg"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleFieldChange}
              />
            </div>

            <div className="text-end mb-4">
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                onClick={() => showAlert('Peça ao administrador do sistema para redefinir sua senha.', 'info', 'Esqueceu a senha?')}
              >
                Esqueci minha senha
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </fieldset>

          <p className="small text-secondary mt-4 mb-0">
            Protótipo com dados fictícios. Não cadastre informações clínicas reais.
          </p>
        </form>
      </section>
    </div>
  )
}