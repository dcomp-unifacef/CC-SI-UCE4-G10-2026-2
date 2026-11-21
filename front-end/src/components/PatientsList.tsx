import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Patient } from '../types/Patient'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatCpf, formatDate, formatNumber, getInitials } from '../utils/format'
import { useDialog } from '../contexts/DialogContext'
import { Icon } from './Icon'

type StatusFilter = 'todos' | 'ativos' | 'inativos'

export function PatientsList() {
  const { showAlert, showConfirm } = useDialog()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')

  async function fetchData() {
    setLoading(true)
    try {
      setPatients(await apiGet<Patient[]>('/patients'))
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

  async function handleDelete(patient: Patient) {
    if (!await showConfirm({
      title: 'Excluir paciente?',
      message: <>O paciente <strong>{patient.name}</strong> será excluído junto com todas as avaliações corporais e planos alimentares dele.</>,
      confirmLabel: 'Excluir paciente',
      danger: true,
    })) {
      return
    }

    try {
      const response = await apiFetch(`/patients/${patient.id}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      showAlert('Paciente excluído com sucesso.', 'success')
      fetchData()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível excluir o paciente. ${message}`, 'error')
    }
  }

  const activeCount = patients.filter(patient => patient.active).length

  // Filtro pelo status e pela busca (nome, CPF ou telefone)
  const term = search.trim().toLowerCase()
  const digits = term.replace(/\D/g, '')
  const filtered = patients.filter(patient => {
    if (status === 'ativos' && !patient.active) return false
    if (status === 'inativos' && patient.active) return false
    if (!term) return true
    return (
      patient.name.toLowerCase().includes(term) ||
      (digits !== '' && (patient.cpf.includes(digits) || patient.phone.replace(/\D/g, '').includes(digits)))
    )
  })

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: 'todos', label: `Todos (${patients.length})` },
    { value: 'ativos', label: `Ativos (${activeCount})` },
    { value: 'inativos', label: `Inativos (${patients.length - activeCount})` },
  ]

  return (
    <>
      <div className="ns-page-header">
        <div>
          <h1>Pacientes</h1>
          <p className="text-secondary mb-0">
            {patients.length} {patients.length === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'} · clique no nome para abrir o prontuário
          </p>
        </div>

        <Link to="/pacientes/new" className="btn btn-primary">
          <Icon name="plus" /> Novo paciente
        </Link>
      </div>

      <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
        <div className="ns-search flex-grow-1" style={{ minWidth: 240 }}>
          <label htmlFor="patient-search" className="visually-hidden">Buscar por nome, CPF ou telefone</label>
          <Icon name="search" className="ns-search-icon" />
          <input
            id="patient-search"
            type="search"
            className="form-control"
            placeholder="Buscar por nome, CPF ou telefone"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div className="ns-tabs d-flex gap-2" role="group" aria-label="Filtrar por status">
          {tabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              className={`btn btn-sm ${status === tab.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="ns-table-wrapper table-responsive">
        <table className="table table-hover align-middle ns-table">
          <thead>
            <tr>
              <th scope="col">Paciente</th>
              <th scope="col">Idade</th>
              <th scope="col">Telefone</th>
              <th scope="col">Última avaliação</th>
              <th scope="col">Meta diária</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(patient => (
              <tr key={patient.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="ns-avatar">{getInitials(patient.name)}</span>
                    <div>
                      <Link to={`/pacientes/${patient.id}/prontuario`} className="fw-semibold text-decoration-none">
                        {patient.name}
                      </Link>
                      <div className="small text-secondary">{formatCpf(patient.cpf)}</div>
                    </div>
                  </div>
                </td>
                <td>{patient.age} anos</td>
                <td className="text-nowrap">{patient.phone}</td>
                <td>
                  {patient.latestAssessment
                    ? formatDate(patient.latestAssessment.assessmentDate)
                    : <span className="text-secondary">Sem avaliação</span>}
                </td>
                <td>
                  {patient.latestAssessment ? (
                    <>
                      <div className="fw-semibold">{formatNumber(patient.latestAssessment.tee)} kcal</div>
                      <div className="small text-secondary">{formatNumber(patient.latestAssessment.water)} ml de água</div>
                    </>
                  ) : <span className="text-secondary">—</span>}
                </td>
                <td>
                  <span className={patient.active ? 'ns-badge-active' : 'ns-badge-inactive'}>
                    {patient.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  <Link
                    to={`/pacientes/${patient.id}/prontuario`}
                    className="btn btn-sm btn-outline-primary me-2"
                    aria-label={`Abrir prontuário de ${patient.name}`}
                  >
                    <Icon name="file" size={16} /> Prontuário
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    aria-label={`Excluir paciente ${patient.name}`}
                    onClick={() => handleDelete(patient)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-4">
                  {patients.length === 0 ? 'Nenhum paciente cadastrado.' : 'Nenhum paciente encontrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}