import type { ActivityLevel } from '../types/Patient'
import type { Food, MeasureUnit } from '../types/Food'

// Número no padrão brasileiro: 2.206 / 26,6
export function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Datas vêm do back-end como "2026-07-20T00:00:00.000Z" (campos @db.Date).
// Usamos UTC para que o dia não "volte" um dia no fuso do Brasil.
export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

// 12345678900 ~> 123.456.789-00
export function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// 11988887777 ~> (11) 98888-7777
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.replace(/(\d{1,2})/, '($1')
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, '($1) $2')
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
  return digits.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3')
}

// "Marina Duarte" ~> "MD"
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function unitLabel(unit: MeasureUnit) {
  return unit === 'ML' ? 'ml' : 'g'
}

// "100 g" ou "50 g (1 unidade)"
export function formatPortion(food: Food) {
  const portion = `${formatNumber(food.portionAmount, food.portionAmount % 1 ? 1 : 0)} ${unitLabel(food.portionUnit)}`
  return food.portionNote ? `${portion} (${food.portionNote})` : portion
}

export const activityLevels: { value: ActivityLevel; label: string }[] = [
  { value: 'SEDENTARIO', label: 'Sedentário (× 1,2)' },
  { value: 'LIGEIRAMENTE_ATIVO', label: 'Ligeiramente ativo (× 1,375)' },
  { value: 'MODERADAMENTE_ATIVO', label: 'Moderadamente ativo (× 1,55)' },
  { value: 'MUITO_ATIVO', label: 'Muito ativo (× 1,725)' },
  { value: 'EXTREMAMENTE_ATIVO', label: 'Extremamente ativo (× 1,9)' },
]