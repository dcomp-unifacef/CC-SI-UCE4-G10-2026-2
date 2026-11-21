import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Diet } from '../types/Diet'
import type { Food } from '../types/Food'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatNumber } from '../utils/format'
import { calculateTotals, defaultMeals, mealsFromApi, mealsToPayload } from '../utils/meals'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'
import { MealsEditor } from './MealsEditor'

const formDefaults = () => ({
  name: '',
  notes: '',
  meals: defaultMeals(),
})

export function DietsForm() {
  const { showAlert, showConfirm } = useDialog()
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [diet, setDiet] = useState(formDefaults)
  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)

  // Busca os alimentos (para as listas de escolha) e, na edição, o modelo
  async function loadData(active: boolean) {
    setLoading(true)
    setLoadFailed(false)
    setFormModified(false)
    setDiet(formDefaults())

    try {
      const foodsResult = await apiGet<Food[]>('/foods')
      if (active) setFoods(foodsResult)

      if (isNew) return

      const result = await apiGet<Diet>(`/diets/${id}`)

      if (active) {
        setDiet({
          name: result.name,
          notes: result.notes ?? '',
          meals: mealsFromApi(result.meals),
        })
      }
    }
    catch (error) {
      if (active) {
        setLoadFailed(true)
        const message = error instanceof Error ? error.message : 'Erro desconhecido.'
        showAlert(`Não foi possível carregar os dados. ${message}`, 'error')
      }
    }
    finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    loadData(active)
    return () => {
      active = false
    }
  }, [id, isNew]) // <~ VETOR DE DEPENDÊNCIAS

  // ----- Funções que alteram o estado (sempre criando cópias, nunca mutando) -----

  function changeDiet(changes: Partial<typeof diet>) {
    setDiet(previous => ({ ...previous, ...changes }))
    setFormModified(true)
  }

  // ----- Totais calculados em tempo real -----

  const dietTotals = calculateTotals(diet.meals, foods).total

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    if (diet.meals.length === 0) {
      showAlert('Adicione pelo menos uma refeição ao modelo.', 'warning')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: diet.name.trim(),
        notes: diet.notes.trim() || null,
        meals: mealsToPayload(diet.meals),
      }

      const response = await apiFetch(isNew ? '/diets' : `/diets/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setFormModified(false)
      navigate('/dietas')
      showAlert('Modelo de dieta salvo com sucesso.', 'success')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível salvar o modelo. ${message}`, 'error')
    }
    finally {
      setLoading(false)
    }
  }

  // Sair do formulário (trilha de navegação ou botão Voltar), avisando se houver algo não salvo
  async function handleLeave(to: string) {
    if (formModified && !await showConfirm({
      title: 'Sair sem salvar?',
      message: 'Há informações não salvas neste formulário. Deseja realmente sair?',
      confirmLabel: 'Sair sem salvar',
    })) {
      return
    }

    navigate(to)
  }

  const backPath = '/dietas'
  const trail = [
    { label: 'Dietas (modelos)', to: '/dietas' },
    { label: isNew ? 'Novo modelo de dieta' : 'Editar modelo de dieta' },
  ]

  const macros = [
    { label: 'Proteínas', value: dietTotals.protein },
    { label: 'Carboidratos', value: dietTotals.carbohydrates },
    { label: 'Gorduras', value: dietTotals.fat },
    { label: 'Fibras', value: dietTotals.fiber },
  ]

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={trail} onNavigate={handleLeave} />
          <h1>{isNew ? 'Novo modelo de dieta' : 'Editar modelo de dieta'}</h1>
          <p className="text-secondary mb-0">Monte as refeições; os totais são atualizados enquanto você edita.</p>
        </div>
      </div>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte à listagem e tente novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados do modelo de dieta</legend>

          <div className="row g-3">
            <div className="col-12 col-xl-8 d-flex flex-column gap-3">
              <div className="ns-card">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="name" className="form-label">Nome do modelo</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      placeholder="Ex.: Hipertrofia"
                      required
                      maxLength={120}
                      autoFocus
                      value={diet.name}
                      onChange={event => changeDiet({ name: event.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="notes" className="form-label">
                      Observações <span className="text-secondary">(opcional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows={2}
                      value={diet.notes}
                      onChange={event => changeDiet({ notes: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <MealsEditor
                meals={diet.meals}
                foods={foods}
                onChange={meals => changeDiet({ meals })}
              />
            </div>

            <div className="col-12 col-xl-4">
              <aside className="ns-card position-sticky" style={{ top: '1rem' }} aria-live="polite">
                <h2 className="ns-card-title mb-1">Resumo do modelo</h2>
                <p className="text-secondary mb-3">Valor energético total</p>
                <div className="ns-stat-value mb-3">{formatNumber(dietTotals.calories)} kcal</div>

                <div className="row g-2 mb-4">
                  {macros.map(macro => (
                    <div className="col-6" key={macro.label}>
                      <div className="ns-macro">
                        <div className="small text-secondary">{macro.label}</div>
                        <div className="ns-macro-value">{formatNumber(macro.value, 1)} g</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary">Salvar modelo</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => handleLeave(backPath)}>
                    Voltar
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  )
}