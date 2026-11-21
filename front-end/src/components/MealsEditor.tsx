import type { Food } from '../types/Food'
import { formatNumber, formatPortion, unitLabel } from '../utils/format'
import { calculateTotals, itemTotals, newItem, newMeal } from '../utils/meals'
import type { ItemForm, MealForm } from '../utils/meals'
import { Icon } from './Icon'

type MealsEditorProps = {
  meals: MealForm[];
  foods: Food[];
  onChange: (meals: MealForm[]) => void;
}

// Editor de refeições (horário, nome e alimentos com quantidade), com as
// calorias de cada alimento e de cada refeição calculadas em tempo real.
// Usado no cadastro de modelos de dieta e nos planos alimentares dos pacientes.
export function MealsEditor({ meals, foods, onChange }: MealsEditorProps) {
  // ----- Funções que alteram as refeições (sempre criando cópias, nunca mutando) -----

  function updateMeal(mealKey: number, changes: Partial<MealForm>) {
    onChange(meals.map(meal => meal.key === mealKey ? { ...meal, ...changes } : meal))
  }

  function updateItem(mealKey: number, itemKey: number, changes: Partial<ItemForm>) {
    const meal = meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, {
      items: meal.items.map(item => item.key === itemKey ? { ...item, ...changes } : item),
    })
  }

  function addMeal() {
    onChange([...meals, newMeal()])
  }

  function removeMeal(mealKey: number) {
    onChange(meals.filter(meal => meal.key !== mealKey))
  }

  function addItem(mealKey: number) {
    const meal = meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, { items: [...meal.items, newItem()] })
  }

  function removeItem(mealKey: number, itemKey: number) {
    const meal = meals.find(m => m.key === mealKey)!
    updateMeal(mealKey, { items: meal.items.filter(item => item.key !== itemKey) })
  }

  const foodById = (foodId: string) => foods.find(food => food.id === Number(foodId))
  const { mealTotals } = calculateTotals(meals, foods)

  return (
    <>
      {meals.map((meal, mealIndex) => (
        <section className="ns-card" key={meal.key} aria-label={`Refeição ${mealIndex + 1}`}>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-4 col-md-3">
              <label htmlFor={`meal-time-${meal.key}`} className="form-label">Horário</label>
              <input
                id={`meal-time-${meal.key}`}
                type="time"
                className="form-control"
                required
                value={meal.time}
                onChange={event => updateMeal(meal.key, { time: event.target.value })}
              />
            </div>
            <div className="col">
              <label htmlFor={`meal-name-${meal.key}`} className="form-label">Refeição</label>
              <input
                id={`meal-name-${meal.key}`}
                type="text"
                className="form-control"
                placeholder="Ex.: Lanche da tarde"
                required
                maxLength={60}
                value={meal.name}
                onChange={event => updateMeal(meal.key, { name: event.target.value })}
              />
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-outline-danger"
                aria-label={`Remover refeição ${meal.name || mealIndex + 1}`}
                onClick={() => removeMeal(meal.key)}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>

          {meal.items.map(item => {
            const food = foodById(item.foodId)
            const totals = itemTotals(food, item.quantity)
            return (
              <div className="row g-2 align-items-center mb-2" key={item.key}>
                <div className="col-12 col-md">
                  <label htmlFor={`food-${item.key}`} className="visually-hidden">Alimento</label>
                  <select
                    id={`food-${item.key}`}
                    className="form-select"
                    value={item.foodId}
                    onChange={event => updateItem(meal.key, item.key, { foodId: event.target.value })}
                  >
                    <option value="">Selecione o alimento...</option>
                    {foods.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {formatPortion(f)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-5 col-md-3">
                  <label htmlFor={`quantity-${item.key}`} className="visually-hidden">Quantidade</label>
                  <div className="input-group">
                    <input
                      id={`quantity-${item.key}`}
                      type="number"
                      className="form-control"
                      placeholder="Qtd."
                      min="0.01"
                      step="0.01"
                      required={item.foodId !== ''}
                      value={item.quantity}
                      onChange={event => updateItem(meal.key, item.key, { quantity: event.target.value })}
                    />
                    <span className="input-group-text">{food ? unitLabel(food.portionUnit) : 'g'}</span>
                  </div>
                </div>
                <div className="col-4 col-md-2 text-end small text-secondary">
                  {formatNumber(totals.calories)} kcal
                </div>
                <div className="col-3 col-md-auto text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger"
                    aria-label="Remover alimento"
                    onClick={() => removeItem(meal.key, item.key)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </div>
            )
          })}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addItem(meal.key)}>
              <Icon name="plus" size={16} /> Adicionar alimento
            </button>
            <span className="fw-semibold">{formatNumber(mealTotals[mealIndex].calories)} kcal</span>
          </div>
        </section>
      ))}

      <button type="button" className="btn btn-outline-primary align-self-start" onClick={addMeal}>
        <Icon name="plus" /> Adicionar refeição
      </button>
    </>
  )
}