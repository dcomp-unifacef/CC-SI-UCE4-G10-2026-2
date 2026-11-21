import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { Patient } from '../types/Patient'
import type { Diet } from '../types/Diet'
import type { Food } from '../types/Food'
import type { BodyAssessment } from '../types/BodyAssessment'
import { apiGet } from '../utils/api'
import { formatCpf, formatDate, formatNumber, getInitials } from '../utils/format'
import { useDialog } from '../contexts/DialogContext'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type DashboardData = {
  patients: Patient[];
  diets: Diet[];
  foods: Food[];
  assessments: BodyAssessment[];
}

type StatCardProps = { label: string; value: number; detail: string; icon: IconName; to: string }

// Card de indicador; o card inteiro é um link para a página correspondente
function StatCard({ label, value, detail, icon, to }: StatCardProps) {
  return (
    <Link to={to} className="ns-card ns-card-link d-block h-100">
      <div className="d-flex justify-content-between align-items-start">
        <span className="ns-stat-label">{label}</span>
        <span className="ns-stat-icon"><Icon name={icon} /></span>
      </div>
      <div className="ns-stat-value">{formatNumber(value)}</div>
      <div className="small text-secondary">{detail}</div>
    </Link>
  )
}

export function Dashboard() {
  const { showAlert } = useDialog()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({ patients: [], diets: [], foods: [], assessments: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchData(active: boolean) {
    try {
      // As quatro listagens são buscadas em paralelo
      const [patients, diets, foods, assessments] = await Promise.all([
        apiGet<Patient[]>('/patients'),
        apiGet<Diet[]>('/diets'),
        apiGet<Food[]>('/foods'),
        apiGet<BodyAssessment[]>('/body-assessments'),
      ])

      if (active) setData({ patients, diets, foods, assessments })
    }
    catch (error) {
      if (active && error instanceof Error) {
        showAlert(`Não foi possível carregar os dados. ${error.message}`, 'error')
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
  }, [])

  const { patients, diets, foods, assessments } = data

  // Avaliações do mês corrente (as datas vêm em UTC)
  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const assessmentsThisMonth = assessments.filter(assessment => {
    const date = new Date(assessment.assessmentDate)
    return date.getUTCFullYear() === now.getFullYear() && date.getUTCMonth() === now.getMonth()
  })
  // A listagem de avaliações já vem ordenada da mais recente para a mais antiga
  const lastAssessment = assessments[0]

  const activePatients = patients.filter(patient => patient.active)
  const customFoods = foods.filter(food => !food.isDefault).length

  // Pacientes com avaliação, do atendimento mais recente para o mais antigo
  const assessedPatients = patients
    .filter(patient => patient.latestAssessment)
    .sort((a, b) => b.latestAssessment!.assessmentDate.localeCompare(a.latestAssessment!.assessmentDate))

  // Gráfico de colunas: pacientes avaliados em ordem alfabética (ordem da API).
  // O topo do eixo é arredondado para o milhar acima do maior GET.
  const chartPatients = patients.filter(patient => patient.latestAssessment)
  const maxTee = Math.max(...chartPatients.map(patient => patient.latestAssessment!.tee), 1)
  const chartMax = Math.ceil(maxTee / 1000) * 1000
  const chartStep = chartMax <= 4000 ? 1000 : 2000
  const chartTicks: number[] = []
  for (let tick = 0; tick <= chartMax; tick += chartStep) chartTicks.push(tick)

  const term = search.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  const searchResults = term
    ? patients.filter(patient =>
        patient.name.toLowerCase().includes(term) || (digits !== '' && patient.cpf.includes(digits))
      ).slice(0, 5)
    : []

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>Painel</h1>
          <p className="text-secondary mb-0">Bem-vinda de volta, {user?.name}.</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/pacientes/new" className="btn btn-primary">
            <Icon name="plus" /> Novo Paciente
          </Link>
          <Link to="/dietas/new" className="btn btn-outline-primary">
            <Icon name="diets" /> Novo modelo de dieta
          </Link>
          <Link to="/planos/new" className="btn btn-outline-primary">
            <Icon name="file" /> Novo plano alimentar
          </Link>
        </div>
      </div>

      <div className="ns-search mb-4">
        <label htmlFor="quick-search" className="visually-hidden">Busca rápida de pacientes</label>
        <Icon name="search" className="ns-search-icon" />
        <input
          id="quick-search"
          type="search"
          className="form-control form-control-lg"
          placeholder="Busca rápida de pacientes"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        {term && (
          <div className="ns-card position-absolute w-100 mt-1 py-1 shadow-sm" style={{ zIndex: 10 }}>
            {searchResults.map(patient => (
              <Link key={patient.id} to={`/pacientes/${patient.id}/prontuario`} className="ns-list-row">
                <span className="ns-avatar">{getInitials(patient.name)}</span>
                <span>
                  <span className="ns-list-name fw-semibold d-block">{patient.name}</span>
                  <span className="small text-secondary">{formatCpf(patient.cpf)}</span>
                </span>
              </Link>
            ))}
            {searchResults.length === 0 && (
              <p className="text-secondary my-2">Nenhum paciente encontrado.</p>
            )}
          </div>
        )}
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard
            label="Total de Pacientes"
            value={patients.length}
            detail={`${activePatients.length} ${activePatients.length === 1 ? 'ativo' : 'ativos'}`}
            icon="patients"
            to="/pacientes"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label={`Avaliações em ${monthName}`}
            value={assessmentsThisMonth.length}
            detail={lastAssessment ? `última em ${formatDate(lastAssessment.assessmentDate)}` : 'nenhuma avaliação registrada'}
            icon="activity"
            to="/avaliacoes"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Modelos de Dieta" value={diets.length} detail="templates prontos" icon="diets" to="/dietas" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Alimentos cadastrados"
            value={foods.length}
            detail={`${customFoods} ${customFoods === 1 ? 'adicionado' : 'adicionados'} por você`}
            icon="foods"
            to="/alimentos"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <section className="ns-card h-100">
            <h2 className="ns-card-title">Gasto Energético Total por paciente</h2>

            {chartPatients.length > 0 && (
              <div className="ns-chart">
                {/* Eixo vertical com as marcações de kcal */}
                <div className="ns-chart-axis" aria-hidden="true">
                  {chartTicks.map(tick => (
                    <span key={tick} style={{ bottom: `${(tick / chartMax) * 100}%` }}>
                      {formatNumber(tick)}
                    </span>
                  ))}
                </div>

                <div className="ns-chart-area">
                  {/* Linhas de grade horizontais */}
                  {chartTicks.map(tick => (
                    <div key={tick} className="ns-chart-grid" style={{ bottom: `${(tick / chartMax) * 100}%` }} />
                  ))}

                  {chartPatients.map(patient => {
                    const tee = patient.latestAssessment!.tee
                    return (
                      // tabIndex permite ver o valor também pelo teclado (foco) ou com toque no celular
                      <div
                        key={patient.id}
                        className="ns-chart-column"
                        tabIndex={0}
                        aria-label={`${patient.name}: ${formatNumber(tee)} kcal`}
                      >
                        <div
                          className={`ns-chart-bar ${patient.active ? '' : 'inactive'}`}
                          style={{ height: `${(tee / chartMax) * 100}%` }}
                        >
                          <span className="ns-chart-value">{formatNumber(tee)} kcal</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Nomes abaixo de cada coluna */}
                <div className="ns-chart-labels" aria-hidden="true">
                  {chartPatients.map(patient => (
                    <span key={patient.id} title={patient.name}>{patient.name.split(' ')[0]}</span>
                  ))}
                </div>
              </div>
            )}

            {!loading && assessedPatients.length === 0 && (
              <p className="text-secondary mb-0">Nenhum paciente avaliado ainda.</p>
            )}
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="ns-card h-100">
            <h2 className="ns-card-title">Últimos atendidos</h2>

            {assessedPatients.slice(0, 5).map(patient => {
              const assessment = patient.latestAssessment!
              return (
                <Link key={patient.id} to={`/pacientes/${patient.id}/prontuario`} className="ns-list-row">
                  <span className="ns-avatar">{getInitials(patient.name)}</span>
                  <span className="flex-grow-1 overflow-hidden">
                    <span className="ns-list-name fw-semibold d-block text-truncate">{patient.name}</span>
                    <span className="small text-secondary">
                      IMC {formatNumber(assessment.bmi, 1)} · GET {formatNumber(assessment.tee)} kcal · {formatDate(assessment.assessmentDate)}
                    </span>
                  </span>
                  <span className={patient.active ? 'ns-badge-active' : 'ns-badge-inactive'}>
                    {patient.active ? 'Ativo' : 'Inativo'}
                  </span>
                </Link>
              )
            })}

            {!loading && assessedPatients.length === 0 && (
              <p className="text-secondary mb-0">Nenhum atendimento registrado.</p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}