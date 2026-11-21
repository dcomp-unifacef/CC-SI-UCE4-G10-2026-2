import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { ActivityLevel, Patient } from '../types/Patient'
import type { BodyAssessment } from '../types/BodyAssessment'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { activityLevels, formatNumber } from '../utils/format'
import { ageAt, bmiClassification, calculateAnthropometry } from '../utils/anthropometry'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'

// Data de hoje no formato do input type="date" (AAAA-MM-DD), no fuso local
function today() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const formDefaults = () => ({
  assessmentDate: today(),
  weight: '',
  height: '',
  activityLevel: '',
})

export function AssessmentsForm() {
  const { showAlert, showConfirm } = useDialog()
  const { patientId, id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const recordPath = `/pacientes/${patientId}/prontuario`

  const [assessment, setAssessment] = useState(formDefaults)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)

  // Busca o paciente (idade e sexo são usados nos cálculos) e, na edição, a avaliação
  async function loadData(active: boolean) {
    setLoading(true)
    setLoadFailed(false)
    setFormModified(false)
    setAssessment(formDefaults())

    try {
      const patientResult = await apiGet<Patient>(`/patients/${patientId}`)
      if (active) setPatient(patientResult)

      if (isNew) return

      const result = await apiGet<BodyAssessment>(`/body-assessments/${id}`)

      if (active) {
        setAssessment({
          assessmentDate: result.assessmentDate.slice(0, 10),
          weight: result.weight.toString(),
          height: result.height.toString(),
          activityLevel: result.activityLevel,
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
  }, [patientId, id, isNew]) // <~ VETOR DE DEPENDÊNCIAS

  function handleFieldChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setAssessment(previous => ({ ...previous, [name]: value }))
    setFormModified(true)
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    setLoading(true)

    try {
      const payload = {
        patientId: Number(patientId),
        assessmentDate: `${assessment.assessmentDate}T00:00:00.000Z`,
        weight: Number(assessment.weight),
        height: Number(assessment.height),
        activityLevel: assessment.activityLevel,
      }

      // Nova avaliação ~> POST /body-assessments; existente ~> PUT /body-assessments/:id
      const response = await apiFetch(isNew ? '/body-assessments' : `/body-assessments/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setFormModified(false)
      navigate(recordPath)
      showAlert('Avaliação salva com sucesso.', 'success')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível salvar a avaliação. ${message}`, 'error')
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

  const backPath = recordPath
  const trail = [
    { label: 'Pacientes', to: '/pacientes' },
    { label: patient?.name ?? 'Prontuário', to: recordPath },
    { label: isNew ? 'Nova avaliação' : 'Editar avaliação' },
  ]

  // ----- Prévia dos indicadores, calculada enquanto os dados são digitados -----
  const weight = Number(assessment.weight)
  const height = Number(assessment.height)
  const canPreview = patient !== null && weight > 0 && height > 0.3 && assessment.activityLevel !== '' && assessment.assessmentDate !== ''
  const age = patient && assessment.assessmentDate ? ageAt(patient.birthDate, assessment.assessmentDate) : null
  const preview = canPreview
    ? calculateAnthropometry(weight, height, age!, patient!.biologicalSex, assessment.activityLevel as ActivityLevel)
    : null

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={trail} onNavigate={handleLeave} />
          <h1>{isNew ? 'Nova avaliação corporal' : 'Editar avaliação corporal'}</h1>
          <p className="text-secondary mb-0">
            {patient ? `${patient.name} · ${patient.biologicalSex === 'FEMININO' ? 'Feminino' : 'Masculino'}` : ' '}
          </p>
        </div>
      </div>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte ao prontuário e tente novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados da avaliação corporal</legend>

          <div className="row g-3">
            <div className="col-12 col-xl-7">
              <div className="ns-card">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="assessmentDate" className="form-label">Data da avaliação</label>
                    <input
                      id="assessmentDate"
                      name="assessmentDate"
                      type="date"
                      className="form-control"
                      required
                      max={today()}
                      value={assessment.assessmentDate}
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="activityLevel" className="form-label">Nível de atividade física</label>
                    <select
                      id="activityLevel"
                      name="activityLevel"
                      className="form-select"
                      required
                      value={assessment.activityLevel}
                      onChange={handleFieldChange}
                    >
                      <option value="">Selecione...</option>
                      {activityLevels.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6">
                    <label htmlFor="weight" className="form-label">Peso</label>
                    <div className="input-group">
                      <input
                        id="weight"
                        name="weight"
                        type="number"
                        className="form-control"
                        required
                        min="1"
                        max="999"
                        step="0.1"
                        autoFocus
                        value={assessment.weight}
                        onChange={handleFieldChange}
                      />
                      <span className="input-group-text">kg</span>
                    </div>
                  </div>

                  <div className="col-6">
                    <label htmlFor="height" className="form-label">Altura</label>
                    <div className="input-group">
                      <input
                        id="height"
                        name="height"
                        type="number"
                        className="form-control"
                        placeholder="Ex.: 1.65"
                        required
                        min="0.5"
                        max="2.7"
                        step="0.01"
                        value={assessment.height}
                        onChange={handleFieldChange}
                      />
                      <span className="input-group-text">m</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-primary">Salvar avaliação</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => handleLeave(backPath)}>
                    Voltar
                  </button>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-5">
              <aside className="ns-card" aria-live="polite">
                <h2 className="ns-card-title mb-1">Resultados</h2>
                <p className="small text-secondary mb-3">
                  Calculados enquanto você digita{age !== null && <> · {age} anos na data da avaliação</>}
                </p>

                {preview ? (
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="ns-macro h-100">
                        <div className="small text-secondary">IMC</div>
                        <div className="ns-macro-value">{formatNumber(preview.bmi, 1)}</div>
                        <div className="small text-secondary">{bmiClassification(preview.bmi)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="ns-macro h-100">
                        <div className="small text-secondary">Água</div>
                        <div className="ns-macro-value">{formatNumber(preview.water)} ml</div>
                        <div className="small text-secondary">35 ml × {formatNumber(weight, 1)} kg</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="ns-macro h-100">
                        <div className="small text-secondary">TMB</div>
                        <div className="ns-macro-value">{formatNumber(preview.bmr)} kcal</div>
                        <div className="small text-secondary">Mifflin-St Jeor</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="ns-preview h-100">
                        <div className="small text-secondary">GET</div>
                        <div className="ns-macro-value">{formatNumber(preview.tee)} kcal</div>
                        <div className="small text-secondary">TMB × fator de atividade</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-secondary mb-0">
                    Preencha data, peso, altura e nível de atividade para ver IMC, água, TMB e GET.
                  </p>
                )}
              </aside>
            </div>
          </div>
        </fieldset>
      </form>
    </>
  )
}