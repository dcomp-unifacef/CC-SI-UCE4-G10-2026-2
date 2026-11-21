import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { getInitials } from '../utils/format'
import { Icon, Logo } from './Icon'
import type { IconName } from './Icon'

const menu: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Painel', icon: 'dashboard' },
  { to: '/pacientes', label: 'Pacientes', icon: 'patients' },
  { to: '/dietas', label: 'Dietas (modelos)', icon: 'diets' },
  { to: '/alimentos', label: 'Alimentos', icon: 'foods' },
]

function Brand() {
  return (
    <div className="d-flex align-items-center gap-2">
      <Logo />
      <div className="lh-sm">
        <div className="fw-bold fs-5 text-white">NutriSync</div>
        <div className="ns-brand-sub">Clínica Nutricional</div>
      </div>
    </div>
  )
}

// Estrutura das páginas internas: menu lateral fixo + conteúdo da rota atual.
// Em telas pequenas o menu vira uma barra superior com botão para abrir.
export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="ns-shell">
      <header className="ns-topbar d-lg-none">
        <Brand />
        <button
          type="button"
          className="btn btn-link text-white p-1"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
      </header>

      <aside className={`ns-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="d-none d-lg-block mb-4">
          <Brand />
        </div>

        <nav aria-label="Menu principal">
          <ul className="nav flex-column gap-1">
            {menu.map(item => (
              <li className="nav-item" key={item.to}>
                <NavLink to={item.to} className="ns-nav-link" onClick={() => setMenuOpen(false)}>
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ns-user mt-auto">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="ns-avatar ns-avatar-light">{getInitials(user?.name ?? '')}</span>
            <div className="lh-sm overflow-hidden">
              <div className="fw-semibold text-white text-truncate">{user?.name}</div>
              <div className="ns-brand-sub">{user?.crn ? `CRN ${user.crn}` : 'CRN não informado'}</div>
            </div>
          </div>
          <button type="button" className="ns-nav-link w-100 border-0 bg-transparent" onClick={handleLogout}>
            <Icon name="logout" />
            Sair
          </button>
        </div>
      </aside>

      <main className="ns-main">
        <Outlet />
      </main>
    </div>
  )
}