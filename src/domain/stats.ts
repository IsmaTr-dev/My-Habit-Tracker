import { addDays, monthDays } from './dates'
import type { DayEntry, Habit, ISODate, MonthKey } from './types'

type Days = Record<ISODate, DayEntry>

export function isDone(days: Days, date: ISODate, habitId: string): boolean {
  return days[date]?.habitsDone?.[habitId] === true
}

export interface HabitMonthStats {
  done: number
  valid: number
  pct: number | null
}

// % del mes: cuentan los días desde el día 1 (o la creación del hábito) hasta ayer.
// Hoy y el día de archivo solo suman si ya están marcados, para no penalizar un día abierto.
export function habitMonthStats(habit: Habit, month: MonthKey, days: Days, today: ISODate): HabitMonthStats {
  let done = 0
  let valid = 0
  for (const d of monthDays(month)) {
    if (d < habit.createdAt || d > today) continue
    if (habit.archivedAt && d > habit.archivedAt) continue
    const checked = isDone(days, d, habit.id)
    const soft = d === today || d === habit.archivedAt
    if (soft && !checked) continue
    valid++
    if (checked) done++
  }
  return { done, valid, pct: valid ? Math.round((done / valid) * 100) : null }
}

// Racha actual: días seguidos cumplidos hasta hoy, o hasta ayer si hoy aún no está marcado
export function currentStreak(habit: Habit, days: Days, today: ISODate): number {
  let d = isDone(days, today, habit.id) ? today : addDays(today, -1)
  let streak = 0
  while (d >= habit.createdAt && isDone(days, d, habit.id)) {
    streak++
    d = addDays(d, -1)
  }
  return streak
}

export function bestStreakInMonth(habit: Habit, month: MonthKey, days: Days, today: ISODate): number {
  let best = 0
  let run = 0
  for (const d of monthDays(month)) {
    if (d > today) break
    run = isDone(days, d, habit.id) ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}
