import { addDays, monthOf } from './dates'
import type { DataState, Habit, ISODate, MonthPage } from './types'

// Solo hoy y ayer son editables
export function isEditable(date: ISODate, today: ISODate): boolean {
  return date === today || date === addDays(today, -1)
}

// Hábitos de la hoja del mes, en su orden, activos en esa fecha.
// Un hábito archivado desaparece desde el mismo día de archivo.
export function habitsForDay(state: DataState, date: ISODate): Habit[] {
  const page = state.months[monthOf(date)]
  if (!page) return []
  return page.habitIds
    .map((id) => state.habits[id])
    .filter((h): h is Habit => !!h && h.createdAt <= date && (!h.archivedAt || date < h.archivedAt))
}

// Hábitos que aparecen en las estadísticas del mes (incluidos los archivados durante el mes)
export function habitsForMonth(state: DataState, page: MonthPage | undefined): Habit[] {
  if (!page) return []
  return page.habitIds.map((id) => state.habits[id]).filter((h): h is Habit => !!h)
}

export function activeHabitCount(state: DataState, page: MonthPage | undefined): number {
  return habitsForMonth(state, page).filter((h) => !h.archivedAt).length
}

export function activeMetrics(state: DataState) {
  return Object.values(state.metrics)
    .filter((m) => !m.archivedAt)
    .sort((a, b) => a.order - b.order)
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20)
}
