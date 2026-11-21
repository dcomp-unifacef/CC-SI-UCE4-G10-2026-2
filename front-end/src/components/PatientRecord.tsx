import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Patient } from '../types/Patient'
import type { BodyAssessment } from '../types/BodyAssessment'
import type { MealPlan } from '../types/MealPlan'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { activityLevels, formatCpf, formatDate, formatNumber, getInitials, unitLabel } from '../utils/format'
import { bmiClassification } from '../utils/anthropometry'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'
import { Icon } from './Icon'

type RecordData = {
  patient: Patient | null;
  assessments: BodyAssessment[];
  plans: MealPlan[];
}

const activityLabel = (value: string) => activityLevels.find(level => level.value === value)?.label ?? value

// Prontuário: dados do paciente, avaliações corporais e planos alimentares atribuídos
export function PatientRecord() {
  const { id } = useParams()
  const { showAlert, showConfirm } = useDialog()
  const [data, setData] = useState<RecordData>({ patient: null, assessments: [], plans: [] })
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  async function fetchData(active: boolean) {
    setLoading(true)
    setLoadFailed(false)

    try {
      // As três consultas são feitas em paralelo
      const [patient, assessments, plans] = await Promise.all([
        apiGet<Patient>(`/patients/${id}`),
        apiGet<BodyAssessment[]>(`/body-assessments/patient/${id}`),
        apiGet<MealPlan[]>(`/meal-plans/patient/${id}`),
      ])

      if (active) setData({ patient, assessments, plans })
    }
    catch (error) {
      if (active) {
        setLoadFailed(true)
        const message = error instanceof Error ? error.message : 'Erro desconhecido.'
        showAlert(`Não foi possível carregar o prontuário. ${message}`, 'error')
      }
    }
    finally {
      if (active) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchData(active)
    return () => {
      active = false
    }
  }, [id]) // <~ VETOR DE DEPENDÊNCIAS

  // Exclusão com dupla confirmação (janela + caixa "Entendo que...")
  async function handleDelete(path: string, title: string, description: React.ReactNode) {
    if (!await showConfirm({ title, message: description, confirmLabel: 'Excluir', danger: true })) return

    try {
      const response = await apiFetch(path, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      showAlert('Registro excluído com sucesso.', 'success')
      fetchData(true)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível excluir. ${message}`, 'error')
    }
  }

  const { patient, assessments, plans } = data

  if (loadFailed) {
    return (
      <div className="alert alert-danger" role="alert">
        Não foi possível carregar o prontuário. <Link to="/pacientes">Volte à listagem</Link> e tente novamente.
      </div>
    )
  }

  if (!patient) {
    return <p role="status">Aguarde, carregando...</p>
  }

  // As avaliações vêm da mais recente para a mais antiga
  const latest = assessments[0]
  const previous = assessments[1]
  const weightChange = latest && previous ? latest.weight - previous.weight : null

  const indicators = latest ? [
    { label: 'Peso', value: `${formatNumber(latest.weight, 1)} kg`,
      detail: weightChange === null ? 'primeira avaliação'
        : `${weightChange > 0 ? '+' : ''}${formatNumber(weightChange, 1)} kg desde ${formatDate(previous.assessmentDate)}` },
    { label: 'Altura', value: `${formatNumber(latest.height, 2)} m`, detail: `${latest.age} anos na avaliação` },
    { label: 'IMC', value: formatNumber(latest.bmi, 1), detail: bmiClassification(latest.bmi) },
    { label: 'TMB', value: `${formatNumber(latest.bmr)} kcal`, detail: 'Mifflin-St Jeor' },
    { label: 'GET', value: `${formatNumber(latest.tee)} kcal`, detail: activityLabel(latest.activityLevel) },
    { label: 'Água', value: `${formatNumber(latest.water)} ml`, detail: `35 ml × ${formatNumber(latest.weight, 1)} kg` },
  ] : []

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={[{ label: 'Pacientes', to: '/pacientes' }, { label: patient.name }]} />
          <div className="d-flex align-items-center gap-3">
            <span className="ns-avatar ns-avatar-lg">{getInitials(patient.name)}</span>
            <div>
              <h1 className="d-flex flex-wrap align-items-center gap-2">
                {patient.name}
                <span className={patient.active ? 'ns-badge-active' : 'ns-badge-inactive'}>
                  {patient.active ? 'Ativo' : 'Inativo'}
                </span>
              </h1>
              <p className="text-secondary mb-0">
                {patient.age} anos · CPF {formatCpf(patient.cpf)} · {patient.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to={`/pacientes/${patient.id}`} className="btn btn-outline-secondary">
            <Icon name="edit" size={16} /> Editar dados
          </Link>
          <Link to={`/pacientes/${patient.id}/avaliacoes/new`} className="btn btn-primary">
            <Icon name="plus" /> Nova avaliação
          </Link>
          <Link to={`/pacientes/${patient.id}/planos/new`} className="btn btn-outline-primary">
            <Icon name="diets" /> Novo plano alimentar
          </Link>
        </div>
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="row g-3 mb-3">
        <div className="col-12 col-xl-5">
          <section className="ns-card h-100 d-flex flex-column">
            <h2 className="ns-card-title">Dados pessoais</h2>
            <dl className="ns-data-list ns-data-grid">
              <div>
                <dt>Data de nascimento</dt>
                <dd>{formatDate(patient.birthDate)} ({patient.age} anos)</dd>
              </div>
              <div>
                <dt>CPF</dt>
                <dd>{formatCpf(patient.cpf)}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{patient.phone}</dd>
              </div>
              <div>
                <dt>Sexo biológico</dt>
                <dd>{patient.biologicalSex === 'FEMININO' ? 'Feminino' : 'Masculino'}</dd>
              </div>
              <div>
                <dt>Gênero</dt>
                <dd>{patient.gender}</dd>
              </div>
              <div>
                <dt>Situação</dt>
                <dd>{patient.active ? 'Em acompanhamento' : 'Inativo'}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="col-12 col-xl-7">
          <section className="ns-card h-100 d-flex flex-column">
            <h2 className="ns-card-title">
              Indicadores atuais
              {latest && <span className="fw-normal text-secondary"> · avaliação de {formatDate(latest.assessmentDate)}</span>}
            </h2>

            {latest ? (
              <div className="ns-indicators">
                {indicators.map(indicator => (
                  <div className="ns-macro" key={indicator.label}>
                    <div className="small text-secondary">{indicator.label}</div>
                    <div className="ns-macro-value">{indicator.value}</div>
                    <div className="small text-secondary">{indicator.detail}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-secondary py-4 my-auto">
                <p>Nenhuma avaliação registrada. Registre a primeira para calcular IMC, TMB, GET e água.</p>
                <Link to={`/pacientes/${patient.id}/avaliacoes/new`} className="btn btn-primary">
                  <Icon name="plus" /> Registrar avaliação
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="ns-card mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="ns-card-title mb-0">
            Avaliações corporais <span className="fw-normal text-secondary">({assessments.length})</span>
          </h2>
          <Link to={`/pacientes/${patient.id}/avaliacoes/new`} className="btn btn-sm btn-outline-primary">
            <Icon name="plus" size={16} /> Nova avaliação
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle ns-table">
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col" className="text-end">Peso</th>
                <th scope="col" className="text-end">Altura</th>
                <th scope="col">Atividade física</th>
                <th scope="col" className="text-end">IMC</th>
                <th scope="col" className="text-end">TMB</th>
                <th scope="col" className="text-end">GET</th>
                <th scope="col" className="text-end">Água</th>
                <th scope="col" className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(assessment => (
                <tr key={assessment.id}>
                  <td className="fw-semibold">{formatDate(assessment.assessmentDate)}</td>
                  <td className="text-end text-nowrap">{formatNumber(assessment.weight, 1)} kg</td>
                  <td className="text-end text-nowrap">{formatNumber(assessment.height, 2)} m</td>
                  <td>{activityLabel(assessment.activityLevel)}</td>
                  <td className="text-end">{formatNumber(assessment.bmi, 1)}</td>
                  <td className="text-end text-nowrap">{formatNumber(assessment.bmr)} kcal</td>
                  <td className="text-end text-nowrap fw-semibold">{formatNumber(assessment.tee)} kcal</td>
                  <td className="text-end text-nowrap">{formatNumber(assessment.water)} ml</td>
                  <td className="text-end text-nowrap">
                    <Link
                      to={`/pacientes/${patient.id}/avaliacoes/${assessment.id}`}
                      className="btn btn-sm btn-outline-primary me-2"
                      aria-label={`Editar avaliação de ${formatDate(assessment.assessmentDate)}`}
                    >
                      <Icon name="edit" size={16} />
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      aria-label={`Excluir avaliação de ${formatDate(assessment.assessmentDate)}`}
                      onClick={() => handleDelete(
                        `/body-assessments/${assessment.id}`,
                        'Excluir avaliação corporal?',
                        <>A avaliação de <strong>{formatDate(assessment.assessmentDate)}</strong> será excluída do prontuário de {patient.name}.</>
                      )}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {assessments.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-secondary py-4">Nenhuma avaliação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ns-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="ns-card-title mb-0">
            Planos alimentares <span className="fw-normal text-secondary">({plans.length})</span>
          </h2>
          <Link to={`/pacientes/${patient.id}/planos/new`} className="btn btn-sm btn-outline-primary">
            <Icon name="plus" size={16} /> Novo plano alimentar
          </Link>
        </div>

        <div className="d-flex flex-column gap-3">
          {plans.map((plan, index) => {
            // Percentual do GET da última avaliação coberto pelo plano
            const percent = latest ? Math.round((plan.totals.calories / latest.tee) * 100) : null
            return (
              <article className="ns-meal" key={plan.id}>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <h3 className="h6 fw-bold mb-1 d-flex flex-wrap align-items-center gap-2">
                      {plan.name}
                      {index === 0 && <span className="ns-badge-active">Atual</span>}
                    </h3>
                    <p className="small text-secondary mb-0">
                      Início em {formatDate(plan.startDate)}
                      {plan.diet && <> · baseado no modelo {plan.diet.name}</>}
                      {' '}· {plan.meals.length} {plan.meals.length === 1 ? 'refeição' : 'refeições'}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Link to={`/pacientes/${patient.id}/planos/${plan.id}`} className="btn btn-sm btn-outline-primary">
                      <Icon name="edit" size={16} /> Editar
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      aria-label={`Excluir plano ${plan.name}`}
                      onClick={() => handleDelete(
                        `/meal-plans/${plan.id}`,
                        'Excluir plano alimentar?',
                        <>O plano <strong>{plan.name}</strong> e todas as refeições dele serão excluídos.</>
                      )}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 small my-2">
                  <span><strong>{formatNumber(plan.totals.calories)} kcal</strong>
                    {percent !== null && <span className="text-secondary"> ({percent}% do GET)</span>}
                  </span>
                  <span>Proteínas {formatNumber(plan.totals.protein, 1)} g</span>
                  <span>Carboidratos {formatNumber(plan.totals.carbohydrates, 1)} g</span>
                  <span>Gorduras {formatNumber(plan.totals.fat, 1)} g</span>
                </div>

                <details>
                  <summary className="small fw-semibold">Ver refeições</summary>
                  <div className="row g-2 mt-1">
                    {plan.meals.map(meal => (
                      <div className="col-12 col-md-6" key={meal.id}>
                        <div className="ns-macro h-100">
                          <div className="d-flex justify-content-between small fw-bold mb-1">
                            <span>{meal.time} · {meal.name}</span>
                            <span>{formatNumber(meal.totals.calories)} kcal</span>
                          </div>
                          <ul className="small mb-0 ps-3">
                            {meal.items.map(item => (
                              <li key={item.id}>
                                {item.food.name} · {formatNumber(item.quantity)} {unitLabel(item.food.portionUnit)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                  {plan.notes && <p className="small text-secondary mt-2 mb-0"><strong>Observações:</strong> {plan.notes}</p>}
                </details>
              </article>
            )
          })}

          {plans.length === 0 && (
            <p className="text-center text-secondary py-3 mb-0">Nenhum plano alimentar atribuído a este paciente.</p>
          )}
        </div>
      </section>
    </>
  )
}