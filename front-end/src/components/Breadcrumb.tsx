import { Fragment } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

export type BreadcrumbItem = {
  label: string;
  // Sem "to": é a página atual (último item)
  to?: string;
}

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  // Usado pelos formulários para avisar sobre informações não salvas antes de sair
  onNavigate?: (to: string) => void;
}

// Trilha de navegação: "← Pacientes › Marina Duarte › Nova avaliação".
// Cada etapa anterior é clicável; a seta volta uma página (a etapa anterior à atual).
export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const links = items.filter(item => item.to)
  const parent = links[links.length - 1]

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, to: string) {
    if (!onNavigate) return
    event.preventDefault()
    onNavigate(to)
  }

  return (
    <nav aria-label="Trilha de navegação" className="ns-breadcrumb">
      {parent?.to && (
        <Link
          to={parent.to}
          className="ns-breadcrumb-back"
          aria-label={`Voltar para ${parent.label}`}
          title={`Voltar para ${parent.label}`}
          onClick={event => handleClick(event, parent.to!)}
        >
          <Icon name="back" size={16} />
        </Link>
      )}

      <ol>
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="ns-breadcrumb-separator">
                <Icon name="chevron" size={14} />
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} onClick={event => handleClick(event, item.to!)}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}