import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useDialog } from '../contexts/DialogContext'
import type { Patient } from '../types/Patient'
import type { Diet } from '../types/Diet'
import type { Food } from '../types/Food'
import type { MealPlan } from '../types/MealPlan'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatNumber } from '../utils/format'
import { calculateTotals, defaultMeals, mealsFromApi, mealsToPayload } from '../utils/meals'
import { Breadcrumb } from './Breadcrumb'
import { Icon } from './Icon'
import { MealsEditor } from './MealsEditor'

// Data de hoje no formato do input type="date" (AAAA-MM-DD), no fuso local
function today() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const formDefaults = (patientId = '') => ({
  patientId,
  name: '',
  startDate: today(),
  notes: '',
  dietId: '',
  meals: defaultMeals(),
})

// Plano alimentar de um paciente: pode partir de um modelo de dieta e ser ajustado.
// Aberto pelo prontuário (/pacientes/:patientId/planos/:id), o paciente vem preenchido e travado.
// Aberto pelo Painel (/planos/new), o usuário escolhe o paciente.
export function MealPlansForm() {
  const { patientId: routePatientId, id } = useParams()
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useDialog()
  const isNew = id === 'new'
  const fromRecord = routePatientId !== undefined
  const backPath = fromRecord ? `/pacientes/${routePatientId}/prontuario` : '/dashboard'

  const [plan, setPlan] = useState(() => formDefaults(routePatientId))
  const [patients, setPatients] = useState<Patient[]>([])
  const [foods, setFoods] = useState<Food[]>([])
  const [diets, setDiets] = useState<Diet[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)

  async function loadData(active: boolean) {
    setLoading(true)
    setLoadFailed(false)
    setFormModified(false)
    setPlan(formDefaults(routePatientId))

    try {
      // Pacientes (com o GET da última avaliação), alimentos e modelos, em paralelo
      const [patientsResult, foodsResult, dietsResult] = await Promise.all([
        apiGet<Patient[]>('/patients'),
        apiGet<Food[]>('/foods'),
        apiGet<Diet[]>('/diets'),
      ])

      if (active) {
        setPatients(patientsResult)
        setFoods(foodsResult)
        setDiets(dietsResult)
      }

      if (isNew) return

      const result = await apiGet<MealPlan>(`/meal-plans/${id}`)

      if (active) {
        setPlan({
          patientId: result.patientId.toString(),
          name: result.name,
          startDate: result.startDate.slice(0, 10),
          notes: result.notes ?? '',
          dietId: result.dietId?.toString() ?? '',
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
  }, [routePatientId, id, isNew]) // <~ VETOR DE DEPENDÊNCIAS

  function changePlan(changes: Partial<typeof plan>) {
    setPlan(previous => ({ ...previous, ...changes }))
    setFormModified(true)
  }

  const patient = patients.find(p => p.id === Number(plan.patientId)) ?? null
  // O paciente não pode ser trocado quando o plano vem do prontuário ou já existe
  const patientLocked = fromRecord || !isNew

  // Copia as refeições do modelo escolhido para o plano
  async function handleApplyDiet() {
    const diet = diets.find(d => d.id === Number(plan.dietId))
    if (!diet) {
      showAlert('Escolha um modelo de dieta.', 'warning')
      return
    }

    // Só pede confirmação se já houver algum alimento escolhido nas refeições
    const hasFoods = plan.meals.some(meal => meal.items.some(item => item.foodId))
    if (hasFoods && !await showConfirm({
      title: 'Substituir as refeições?',
      message: `As refeições atuais serão substituídas pelas do modelo ${diet.name}.`,
      confirmLabel: 'Substituir',
    })) {
      return
    }

    changePlan({
      meals: mealsFromApi(diet.meals),
      // Sugere um nome se ainda não houver
      name: plan.name || `${diet.name} · ${patient?.name.split(' ')[0] ?? ''}`.trim(),
      notes: plan.notes || diet.notes || '',
    })
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    if (!plan.patientId) {
      showAlert('Selecione o paciente do plano.', 'warning')
      return
    }

    if (plan.meals.length === 0) {
      showAlert('Adicione pelo menos uma refeição ao plano.', 'warning')
      return
    }

    setLoading(true)

    try {
      const payload = {
        patientId: Number(plan.patientId),
        name: plan.name.trim(),
        startDate: `${plan.startDate}T00:00:00.000Z`,
        notes: plan.notes.trim() || null,
        dietId: plan.dietId ? Number(plan.dietId) : null,
        meals: mealsToPayload(plan.meals),
      }

      // Novo plano ~> POST /meal-plans; existente ~> PUT /meal-plans/:id
      const response = await apiFetch(isNew ? '/meal-plans' : `/meal-plans/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setFormModified(false)
      // Depois de salvar, abre o prontuário do paciente para mostrar o plano
      navigate(`/pacientes/${plan.patientId}/prontuario`)
      showAlert('Plano alimentar salvo com sucesso.', 'success')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível salvar o plano. ${message}`, 'error')
    }
    finally {
      setLoading(false)
    }
  }

  // Sair do formulário (trilha de navegação ou botão Voltar)
  async function handleLeave(to: string) {
    if (formModified && !await showConfirm({
      title: 'Sair sem salvar?',
      message: 'Há informações não salvas neste plano. Deseja realmente sair?',
      confirmLabel: 'Sair sem salvar',
    })) {
      return
    }

    navigate(to)
  }

  const title = isNew ? 'Novo plano alimentar' : 'Editar plano alimentar'
  const trail = fromRecord
    ? [
        { label: 'Pacientes', to: '/pacientes' },
        { label: patient?.name ?? 'Prontuário', to: backPath },
        { label: title },
      ]
    : [{ label: 'Painel', to: '/dashboard' }, { label: title }]

  // ----- Totais em tempo real, comparados ao GET da última avaliação -----
  const totals = calculateTotals(plan.meals, foods).total
  const tee = patient?.latestAssessment?.tee ?? null
  const difference = tee !== null ? Math.round(totals.calories - tee) : null

  const macros = [
    { label: 'Proteínas', value: totals.protein },
    { label: 'Carboidratos', value: totals.carbohydrates },
    { label: 'Gorduras', value: totals.fat },
    { label: 'Fibras', value: totals.fiber },
  ]

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={trail} onNavigate={handleLeave} />
          <h1>{title}</h1>
          <p className="text-secondary mb-0">
            {patient ? `Plano de ${patient.name}` : 'Escolha o paciente e monte as refeições.'}
          </p>
        </div>
      </div>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte à página anterior e tente novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados do plano alimentar</legend>

          <div className="row g-3">
            <div className="col-12 col-xl-8 d-flex flex-column gap-3">
              <div className="ns-card">
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="patientId" className="form-label">Paciente</label>
                    <select
                      id="patientId"
                      name="patientId"
                      className="form-select"
                      required
                      disabled={patientLocked}
                      value={plan.patientId}
                      onChange={event => changePlan({ patientId: event.target.value })}
                    >
                      <option value="">Selecione o paciente</option>
                      {patients.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.name}{option.active ? '' : ' (inativo)'}
                        </option>
                      ))}
                    </select>
                    {patientLocked ? (
                      <div className="form-text">
                        <Icon name="lock" size={13} /> {fromRecord
                          ? 'Plano aberto pelo prontuário: o paciente não pode ser trocado.'
                          : 'O paciente de um plano já salvo não pode ser trocado.'}
                      </div>
                    ) : patient && !patient.latestAssessment && (
                      <div className="form-text">Este paciente ainda não tem avaliação, então não há GET para comparar.</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="dietId" className="form-label">
                      Partir de um modelo <span className="text-secondary">(opcional)</span>
                    </label>
                    <div className="input-group">
                      <select
                        id="dietId"
                        name="dietId"
                        className="form-select"
                        value={plan.dietId}
                        onChange={event => changePlan({ dietId: event.target.value })}
                      >
                        <option value="">Nenhum (montar do zero)</option>
                        {diets.map(diet => (
                          <option key={diet.id} value={diet.id}>
                            {diet.name} — {formatNumber(diet.totals.calories)} kcal
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        disabled={!plan.dietId}
                        onClick={handleApplyDiet}
                      >
                        Aplicar modelo
                      </button>
                    </div>
                    <div className="form-text">As refeições do modelo são copiadas e podem ser ajustadas para este paciente.</div>
                  </div>

                  <div className="col-12 col-md-8">
                    <label htmlFor="name" className="form-label">Nome do plano</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="form-control"
                      placeholder="Ex.: Hipertrofia · Marina"
                      required
                      maxLength={120}
                      value={plan.name}
                      onChange={event => changePlan({ name: event.target.value })}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label htmlFor="startDate" className="form-label">Início</label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      className="form-control"
                      required
                      value={plan.startDate}
                      onChange={event => changePlan({ startDate: event.target.value })}
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
                      value={plan.notes}
                      onChange={event => changePlan({ notes: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <MealsEditor
                meals={plan.meals}
                foods={foods}
                onChange={meals => changePlan({ meals })}
              />
            </div>

            <div className="col-12 col-xl-4">
              <aside className="ns-card position-sticky" style={{ top: '1rem' }} aria-live="polite">
                <h2 className="ns-card-title mb-1">Resumo do plano</h2>
                <p className="text-secondary mb-3">Valor energético total</p>
                <div className="ns-stat-value mb-2">{formatNumber(totals.calories)} kcal</div>

                {tee !== null && difference !== null ? (
                  <p className="small mb-3">
                    GET do paciente: <strong>{formatNumber(tee)} kcal</strong>
                    <br />
                    <span className={Math.abs(difference) <= tee * 0.05 ? 'text-success' : 'text-secondary'}>
                      {difference === 0 ? 'Exatamente o GET'
                        : difference > 0 ? `${formatNumber(difference)} kcal acima do GET`
                        : `Faltam ${formatNumber(-difference)} kcal para o GET`}
                    </span>
                  </p>
                ) : (
                  <p className="small text-secondary mb-3">
                    {patient
                      ? 'O paciente ainda não tem avaliação, então não há GET para comparar.'
                      : 'Selecione o paciente para comparar o total com o GET dele.'}
                  </p>
                )}

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
                  <button type="submit" className="btn btn-primary">Salvar plano</button>
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