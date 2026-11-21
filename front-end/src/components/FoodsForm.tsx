import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { Food } from '../types/Food'
import { apiFetch, apiGet, getErrorMessage } from '../utils/api'
import { useDialog } from '../contexts/DialogContext'
import { Breadcrumb } from './Breadcrumb'

// Inputs controlados recebem strings, inclusive os campos numéricos.
const formDefaults = {
  name: '',
  portionAmount: '100',
  portionUnit: 'G',
  portionNote: '',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
  fiber: '',
}

// Campos numéricos de valor nutricional, na ordem em que aparecem no formulário
const nutrientFields = [
  { name: 'calories', label: 'Energia (kcal)', step: '1' },
  { name: 'protein', label: 'Proteínas (g)', step: '0.1' },
  { name: 'carbohydrates', label: 'Carboidratos (g)', step: '0.1' },
  { name: 'fat', label: 'Gorduras (g)', step: '0.1' },
  { name: 'fiber', label: 'Fibras (g)', step: '0.1' },
] as const

export function FoodsForm() {
  const { showAlert, showConfirm } = useDialog()
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [food, setFood] = useState({ ...formDefaults })
  const [loading, setLoading] = useState(!isNew)
  const [loadFailed, setLoadFailed] = useState(false)
  const [formModified, setFormModified] = useState(false)

  async function loadData(active: boolean) {
    setLoadFailed(false)
    setFormModified(false)
    setFood({ ...formDefaults })

    if (isNew) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const result = await apiGet<Food>(`/foods/${id}`)

      if (active) {
        setFood({
          name: result.name,
          portionAmount: result.portionAmount.toString(),
          portionUnit: result.portionUnit,
          portionNote: result.portionNote ?? '',
          calories: result.calories.toString(),
          protein: result.protein.toString(),
          carbohydrates: result.carbohydrates.toString(),
          fat: result.fat.toString(),
          fiber: result.fiber.toString(),
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
    setFood(previous => ({ ...previous, [name]: value }))
    setFormModified(true)
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading || loadFailed) return

    setLoading(true)

    try {
      const payload = {
        name: food.name.trim(),
        portionAmount: Number(food.portionAmount),
        portionUnit: food.portionUnit,
        portionNote: food.portionNote.trim() || null,
        calories: Number(food.calories),
        protein: Number(food.protein),
        carbohydrates: Number(food.carbohydrates),
        fat: Number(food.fat),
        fiber: Number(food.fiber),
      }

      const response = await apiFetch(isNew ? '/foods' : `/foods/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      setFormModified(false)
      navigate('/alimentos')
      showAlert('Alimento salvo com sucesso.', 'success')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido.'
      showAlert(`Não foi possível salvar o alimento. ${message}`, 'error')
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

  const backPath = '/alimentos'
  const trail = [
    { label: 'Banco de alimentos', to: '/alimentos' },
    { label: isNew ? 'Novo alimento' : 'Editar alimento' },
  ]

  const unit = food.portionUnit === 'ML' ? 'ml' : 'g'

  return (
    <>
      <div className="ns-page-header">
        <div>
          <Breadcrumb items={trail} onNavigate={handleLeave} />
          <h1>{isNew ? 'Novo alimento' : 'Editar alimento'}</h1>
          <p className="text-secondary mb-0">
            Informe os valores nutricionais referentes à porção indicada.
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
          <legend className="visually-hidden">Dados do alimento</legend>

          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="name" className="form-label">Nome do alimento</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Ex.: Arroz integral cozido"
                required
                maxLength={120}
                autoFocus
                value={food.name}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="portionAmount" className="form-label">Porção</label>
              <input
                id="portionAmount"
                name="portionAmount"
                type="number"
                className="form-control"
                required
                min="0.01"
                step="0.01"
                value={food.portionAmount}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="portionUnit" className="form-label">Unidade</label>
              <select
                id="portionUnit"
                name="portionUnit"
                className="form-select"
                required
                value={food.portionUnit}
                onChange={handleFieldChange}
              >
                <option value="G">gramas (g)</option>
                <option value="ML">mililitros (ml)</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="portionNote" className="form-label">
                Medida caseira <span className="text-secondary">(opcional)</span>
              </label>
              <input
                id="portionNote"
                name="portionNote"
                type="text"
                className="form-control"
                placeholder="Ex.: 1 unidade, 1 colher de sopa"
                maxLength={60}
                value={food.portionNote}
                onChange={handleFieldChange}
              />
            </div>

            <div className="col-12">
              <h2 className="h6 fw-bold mt-2 mb-0">
                Valores por {food.portionAmount || '—'} {unit}
              </h2>
            </div>

            {nutrientFields.map(field => (
              <div className="col-6 col-md" key={field.name}>
                <label htmlFor={field.name} className="form-label">{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  className="form-control"
                  required
                  min="0"
                  step={field.step}
                  value={food[field.name]}
                  onChange={handleFieldChange}
                />
              </div>
            ))}
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