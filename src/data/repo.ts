import type { DataState, DayEntry, Habit, ISODate, MonthPage, MoodMetric } from '../domain/types'

// Cambios parciales de un día. Los mapas (habitsDone, ratings) se fusionan, no se reemplazan.
export type DayPatch = Partial<Omit<DayEntry, 'id' | 'updatedAt'>>

export interface Repo {
  readonly mode: 'local' | 'firebase'
  subscribe(listener: (state: DataState) => void): () => void
  saveHabit(habit: Habit): Promise<void>
  saveMonth(page: MonthPage): Promise<void>
  saveMetric(metric: MoodMetric): Promise<void>
  patchDay(date: ISODate, patch: DayPatch): Promise<void>
}

export function mergeDay(prev: DayEntry | undefined, date: ISODate, patch: DayPatch): DayEntry {
  return {
    ...prev,
    ...patch,
    id: date,
    habitsDone: { ...prev?.habitsDone, ...patch.habitsDone },
    ratings: { ...prev?.ratings, ...patch.ratings },
    updatedAt: Date.now(),
  }
}
