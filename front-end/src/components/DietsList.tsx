import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Diet } from '../types/Diet'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatNumber, unitLabel } from '../utils/format'
import { useDialog } from '../contexts/DialogContext'
import { Icon } from './Icon'

export function DietsList() {
  const { showAlert, showConfirm } = useDialog()
  const [diets, setDiets] = useState<Diet[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const result = await apiGet<Diet[]>('/diets')
      setDiets(result)
      // Mantém o modelo selecionado; se não houver, seleciona o primeiro
      setSelectedId(current => result.some(diet => diet.id === current) ? current : result[0]?.id ?? null)
    }
    catch (error) {
      if (error instanceof Error) {
        showAlert(`Não foi possível carregar os dados. ${error.message}`, 'error')
      }
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleDelete(diet: Diet) {
    if (!await showConfirm({
      title: 'Excluir modelo de dieta?',
      message: <>O modelo <strong>{diet.name}</strong> será excluído. Os planos alimentares já criados a partir dele não são afetados.</>,
      confirmLabel: 'Excluir modelo',
      danger: true,
    })) {
      return
    }

    try {
      const response = await apiFetch(`/diets/${diet.id}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      showAlert('Modelo excluído com sucesso.', 'success')
      fetchData()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível excluir o modelo. ${message}`, 'error')
    }
  }

  const selected = diets.find(diet => diet.id === selectedId)

  const macros = selected ? [
    { label: 'Proteínas', value: selected.totals.protein },
    { label: 'Carboidratos', value: selected.totals.carbohydrates },
    { label: 'Gorduras', value: selected.totals.fat },
    { label: 'Fibras', value: selected.totals.fiber },
  ] : []

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>Dietas (modelos)</h1>
          <p className="text-secondary mb-0">Modelos reutilizáveis de planos alimentares</p>
        </div>

        <Link to="/dietas/new" className="btn btn-primary">
          <Icon name="plus" /> Novo modelo
        </Link>
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      {!loading && diets.length === 0 && (
        <div className="ns-card text-center text-secondary py-5">
          Nenhum modelo de dieta cadastrado.
        </div>
      )}

      {diets.length > 0 && (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="d-flex flex-column gap-2" role="list" aria-label="Modelos de dieta">
              {diets.map(diet => (
                <button
                  key={diet.id}
                  type="button"
                  role="listitem"
                  className={`ns-diet-card ${diet.id === selectedId ? 'selected' : ''}`}
                  aria-current={diet.id === selectedId}
                  onClick={() => setSelectedId(diet.id)}
                >
                  <div className="fw-bold">{diet.name} · {formatNumber(diet.totals.calories)} kcal</div>
                  <div className="small text-secondary">
                    {formatNumber(diet.totals.calories)} kcal · {diet.meals.length} {diet.meals.length === 1 ? 'refeição' : 'refeições'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="col-12 col-lg-8">
              <section className="ns-card">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <h2 className="h4 mb-1">{selected.name}</h2>
                    <p className="text-secondary mb-0">
                      Valor energético total: <strong className="text-body">{formatNumber(selected.totals.calories)} kcal</strong>
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Link to={`/dietas/${selected.id}`} className="btn btn-sm btn-outline-primary">
                      <Icon name="edit" size={16} /> Editar
                    </Link>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(selected)}>
                      <Icon name="trash" size={16} /> Excluir
                    </button>
                  </div>
                </div>

                <div className="row g-2 mb-4">
                  {macros.map(macro => (
                    <div className="col-6 col-md-3" key={macro.label}>
                      <div className="ns-macro">
                        <div className="small text-secondary">{macro.label}</div>
                        <div className="ns-macro-value">{formatNumber(macro.value, 1)} g</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-flex flex-column gap-3">
                  {selected.meals.map(meal => (
                    <div className="ns-meal" key={meal.id}>
                      <div className="d-flex justify-content-between mb-2">
                        <h3 className="h6 fw-bold mb-0">{meal.time} · {meal.name}</h3>
                        <span className="small fw-semibold text-secondary">{formatNumber(meal.totals.calories)} kcal</span>
                      </div>
                      <ul className="mb-0 ps-3">
                        {meal.items.map(item => (
                          <li key={item.id} className="d-flex justify-content-between">
                            <span>{item.food.name}</span>
                            <span className="text-secondary">
                              {formatNumber(item.quantity)} {unitLabel(item.food.portionUnit)}
                            </span>
                          </li>
                        ))}
                        {meal.items.length === 0 && (
                          <li className="text-secondary">Nenhum alimento nesta refeição.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <p className="small text-secondary mt-3 mb-0">
                    <strong>Observações:</strong> {selected.notes}
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </>
  )
}