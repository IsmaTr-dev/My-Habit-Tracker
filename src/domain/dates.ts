import type { ISODate, MonthKey } from './types'

// El día lógico empieza a las 04:00: marcar algo a las 00:30 cuenta para el día anterior
export const DAY_CUTOFF_HOUR = 4

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function logicalToday(now: Date = new Date()): ISODate {
  const shifted = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - DAY_CUTOFF_HOUR, now.getMinutes())
  return toISODate(shifted)
}

// Aritmética en UTC para no depender de cambios de horario
function parseUTC(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatUTC(d: Date): ISODate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseUTC(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return formatUTC(d)
}

export function monthOf(iso: ISODate): MonthKey {
  return iso.slice(0, 7)
}

export function dayOfMonth(iso: ISODate): number {
  return Number(iso.slice(8, 10))
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function monthDays(month: MonthKey): ISODate[] {
  return Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${pad(i + 1)}`)
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

// 0 = lunes … 6 = domingo
export function weekdayMon0(iso: ISODate): number {
  return (parseUTC(iso).getUTCDay() + 6) % 7
}

export function monthName(month: MonthKey): string {
  return MONTHS_ES[Number(month.slice(5, 7)) - 1]
}

export function monthLabel(month: MonthKey): string {
  return `${monthName(month)} ${month.slice(0, 4)}`
}
