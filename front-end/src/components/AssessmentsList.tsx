import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { BodyAssessment } from '../types/BodyAssessment'
import { apiGet } from '../utils/api'
import { formatDate, formatNumber, getInitials } from '../utils/format'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'
import { Icon } from './Icon'

// Todas as avaliações corporais registradas, da mais recente para a mais antiga
export function AssessmentsList() {
  const { showAlert } = useDialog()
  const [assessments, setAssessments] = useState<BodyAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      setAssessments(await apiGet<BodyAssessment[]>('/body-assessments'))
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

  const term = search.trim().toLowerCase()
  const filtered = assessments.filter(assessment => assessment.patient.name.toLowerCase().includes(term))

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={[{ label: 'Painel', to: '/dashboard' }, { label: 'Avaliações corporais' }]} />
          <h1>Avaliações corporais</h1>
          <p className="text-secondary mb-0">
            {assessments.length} {assessments.length === 1 ? 'avaliação registrada' : 'avaliações registradas'} · para registrar uma nova, abra o prontuário do paciente
          </p>
        </div>
      </div>

      <div className="ns-search mb-3" style={{ maxWidth: 420 }}>
        <label htmlFor="assessment-search" className="visually-hidden">Buscar por paciente</label>
        <Icon name="search" className="ns-search-icon" />
        <input
          id="assessment-search"
          type="search"
          className="form-control"
          placeholder="Buscar por paciente"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && <p role="status">Aguarde, carregando...</p>}

      <div className="ns-table-wrapper table-responsive">
        <table className="table table-hover align-middle ns-table">
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Paciente</th>
              <th scope="col" className="text-end">Peso</th>
              <th scope="col" className="text-end">Altura</th>
              <th scope="col" className="text-end">IMC</th>
              <th scope="col" className="text-end">GET</th>
              <th scope="col" className="text-end">Água</th>
              <th scope="col" className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(assessment => (
              <tr key={assessment.id}>
                <td className="fw-semibold">{formatDate(assessment.assessmentDate)}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <span className="ns-avatar">{getInitials(assessment.patient.name)}</span>
                    <Link to={`/pacientes/${assessment.patientId}/prontuario`} className="fw-semibold text-decoration-none">
                      {assessment.patient.name}
                    </Link>
                  </div>
                </td>
                <td className="text-end text-nowrap">{formatNumber(assessment.weight, 1)} kg</td>
                <td className="text-end text-nowrap">{formatNumber(assessment.height, 2)} m</td>
                <td className="text-end">{formatNumber(assessment.bmi, 1)}</td>
                <td className="text-end text-nowrap fw-semibold">{formatNumber(assessment.tee)} kcal</td>
                <td className="text-end text-nowrap">{formatNumber(assessment.water)} ml</td>
                <td className="text-end text-nowrap">
                  <Link
                    to={`/pacientes/${assessment.patientId}/prontuario`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <Icon name="file" size={16} /> Prontuário
                  </Link>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-secondary py-4">
                  {assessments.length === 0 ? 'Nenhuma avaliação registrada.' : 'Nenhuma avaliação encontrada.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}