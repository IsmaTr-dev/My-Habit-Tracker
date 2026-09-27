import { EMPTY_STATE, type DataState } from '../domain/types'
import { mergeDay, type Repo } from './repo'

// Modo local: todo se guarda en localStorage de este navegador (sin cuenta ni sincronización)
export function createLocalRepo(uid: string): Repo {
  const key = `cuaderno:v1:${uid}`
  const listeners = new Set<(s: DataState) => void>()

  const load = (): DataState => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE
    } catch {
      return EMPTY_STATE
    }
  }

  let state = load()

  const commit = (next: DataState) => {
    state = next
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Almacenamiento lleno o bloqueado: se mantiene en memoria
    }
    listeners.forEach((l) => l(state))
  }

  // Sincroniza entre pestañas abiertas
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      state = load()
      listeners.forEach((l) => l(state))
    }
  })

  return {
    mode: 'local',
    subscribe(listener) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
    async saveHabit(habit) {
      commit({ ...state, habits: { ...state.habits, [habit.id]: habit } })
    },
    async saveMonth(page) {
      commit({ ...state, months: { ...state.months, [page.id]: page } })
    },
    async saveMetric(metric) {
      commit({ ...state, metrics: { ...state.metrics, [metric.id]: metric } })
    },
    async patchDay(date, patch) {
      commit({ ...state, days: { ...state.days, [date]: mergeDay(state.days[date], date, patch) } })
    },
  }
}
