import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Patient } from '../types/Patient'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { formatCpf, formatPhone } from '../utils/format'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'

// Inputs controlados recebem strings; a conversão para os tipos
// esperados pelo back-end ocorre antes da gravação.
const formDefaults = {
  name: '',
  birthDate: '',
  cpf: '',
  phone: '',
  gender: '',
  biologicalSex: '',
  active: true,
}

const genders = ['Feminino', 'Masculino', 'Não binário', 'Prefere não informar']

export function PatientsForm() {
  const { showAlert, showConfirm } = useDialog()
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [patient, setPatient] = useState({ ...formDefaults })
  const [loading, setLoading] = useState(!isNew)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)
  // Nome como estava salvo, para a trilha de navegação não mudar enquanto se digita
  const [savedName, setSavedName] = useState('')

  // Na edição, busca os dados do paciente para preencher o formulário
  async function loadData(active: boolean) {
    setLoadFailed(false)
    setFormModified(false)
    setPatient({ ...formDefaults })

    if (isNew) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const result = await apiGet<Patient>(`/patients/${id}`)

      if (active) {
        setSavedName(result.name)
        setPatient({
          name: result.name,
          birthDate: result.birthDate.slice(0, 10),
          cpf: formatCpf(result.cpf),
          phone: result.phone,
          gender: result.gender,
          biologicalSex: result.biologicalSex,
          active: result.active,
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

  function handleFieldChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    let fieldValue: string | boolean = value

    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      fieldValue = event.target.checked
    }
    // Máscaras de CPF e telefone aplicadas enquanto se digita
    else if (name === 'cpf') fieldValue = formatCpf(value)
    else if (name === 'phone') fieldValue = formatPhone(value)

    setPatient(previous => ({ ...previous, [name]: fieldValue }))
    setFormModified(true)
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    if (patient.cpf.replace(/\D/g, '').length !== 11) {
      showAlert('Informe o CPF completo, com 11 dígitos.', 'warning')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...patient,
        name: patient.name.trim(),
        birthDate: `${patient.birthDate}T00:00:00.000Z`,
      }

      // Novo paciente ~> POST /patients; existente ~> PUT /patients/:id
      const response = await apiFetch(isNew ? '/patients' : `/patients/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      // Após salvar, abre o prontuário do paciente
      const saved: Patient = await response.json()

      setFormModified(false)
      navigate(`/pacientes/${saved.id}/prontuario`)
      showAlert('Paciente salvo com sucesso.', 'success')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível salvar o paciente. ${message}`, 'error')
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

  const backPath = isNew ? '/pacientes' : `/pacientes/${id}/prontuario`
  const trail = isNew
    ? [{ label: 'Pacientes', to: '/pacientes' }, { label: 'Novo paciente' }]
    : [
        { label: 'Pacientes', to: '/pacientes' },
        { label: savedName || 'Prontuário', to: backPath },
        { label: 'Editar dados' },
      ]

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={trail} onNavigate={handleLeave} />
          <h1>{isNew ? 'Novo paciente' : 'Editar paciente'}</h1>
          <p className="text-secondary mb-0">
            Os dados pessoais são usados nos cálculos da avaliação corporal.
          </p>
        </div>
      </div>

      {loading && <p role="status">Aguarde, processando...</p>}

      {loadFailed && (
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados. Volte à listagem e tente novamente.
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="ns-card" style={{ maxWidth: 860 }}>
        <fieldset disabled={loading || loadFailed}>
          <legend className="visually-hidden">Dados do paciente</legend>

          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="name" className="form-label">Nome completo</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                required
                maxLength={120}
                autoFocus
                value={patient.name}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="birthDate" className="form-label">Data de nascimento</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                className="form-control"
                required
                max={today}
                value={patient.birthDate}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="cpf" className="form-label">CPF</label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                className="form-control"
                placeholder="000.000.000-00"
                required
                value={patient.cpf}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="phone" className="form-label">Telefone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="(00) 00000-0000"
                required
                minLength={14}
                value={patient.phone}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="biologicalSex" className="form-label">Sexo biológico</label>
              <select
                id="biologicalSex"
                name="biologicalSex"
                className="form-select"
                required
                value={patient.biologicalSex}
                onChange={handleFieldChange}
              >
                <option value="">Selecione...</option>
                <option value="FEMININO">Feminino</option>
                <option value="MASCULINO">Masculino</option>
              </select>
              <div className="form-text">Usado no cálculo da Taxa Metabólica Basal.</div>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="gender" className="form-label">Gênero</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                required
                value={patient.gender}
                onChange={handleFieldChange}
              >
                <option value="">Selecione...</option>
                {/* Mantém o valor salvo mesmo que não esteja na lista */}
                {patient.gender && !genders.includes(patient.gender) && (
                  <option value={patient.gender}>{patient.gender}</option>
                )}
                {genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  role="switch"
                  className="form-check-input"
                  checked={patient.active}
                  onChange={handleFieldChange}
                />
                <label htmlFor="active" className="form-check-label">
                  Paciente ativo (em acompanhamento)
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => handleLeave(backPath)}>
              Voltar
            </button>
          </div>
        </fieldset>
      </form>
    </>
  )
}