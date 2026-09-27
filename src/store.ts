import { create } from 'zustand'
import { createLocalRepo } from './data/localRepo'
import type { DayPatch, Repo } from './data/repo'
import { addDays, logicalToday, monthOf } from './domain/dates'
import { EMPTY_STATE, type DataState, type Habit, type ISODate, type MonthKey, type MonthPage, type MoodMetric } from './domain/types'

export const firebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

export type Tab = 'habitos' | 'stats' | 'animo'

export interface SessionUser {
  uid: string
  name: string
}

// Estado del calendario, derivado del historial del navegador para que "atrás" suba un nivel
export type CalendarView =
  | { level: 'year'; year: number }
  | { level: 'month'; month: MonthKey }
  | { level: 'day'; date: ISODate }

interface AppState {
  authReady: boolean
  user: SessionUser | null
  repo: Repo | null
  data: DataState
  loaded: boolean
  today: ISODate
  tab: Tab
  viewingYesterday: boolean
  statsMonth: MonthKey
  calendar: CalendarView | null
  calendarDepth: number

  setUser(user: SessionUser | null, repo: Repo | null): void
  tick(): void
  setTab(tab: Tab): void
  setViewingYesterday(v: boolean): void
  setStatsMonth(m: MonthKey): void

  saveHabit(h: Habit): void
  saveMonth(p: MonthPage): void
  saveMetric(m: MoodMetric): void
  patchDay(date: ISODate, patch: DayPatch): void
}

let unsubscribeData: (() => void) | null = null

const report = (p: Promise<void>) => p.catch((err) => console.error('No se pudo guardar', err))

export const useApp = create<AppState>((set, get) => ({
  authReady: !firebaseConfigured,
  user: firebaseConfigured ? null : { uid: 'local', name: 'Local' },
  repo: firebaseConfigured ? null : createLocalRepo('local'),
  data: EMPTY_STATE,
  loaded: false,
  today: logicalToday(),
  tab: 'habitos',
  viewingYesterday: false,
  statsMonth: monthOf(logicalToday()),
  calendar: null,
  calendarDepth: 0,

  setUser(user, repo) {
    unsubscribeData?.()
    unsubscribeData = null
    set({ user, repo, authReady: true, data: EMPTY_STATE, loaded: false })
    if (repo) unsubscribeData = repo.subscribe((data) => set({ data, loaded: true }))
  },
  tick() {
    const today = logicalToday()
    if (today !== get().today) set({ today, viewingYesterday: false })
  },
  setTab: (tab) => set({ tab }),
  setViewingYesterday: (viewingYesterday) => set({ viewingYesterday }),
  setStatsMonth: (statsMonth) => set({ statsMonth }),

  // Las escrituras no se esperan: Firestore aplica el cambio en local al instante (también sin conexión)
  saveHabit: (h) => { const r = get().repo; if (r) report(r.saveHabit(h)) },
  saveMonth: (p) => { const r = get().repo; if (r) report(r.saveMonth(p)) },
  saveMetric: (m) => { const r = get().repo; if (r) report(r.saveMetric(m)) },
  patchDay: (date, patch) => { const r = get().repo; if (r) report(r.patchDay(date, patch)) },
}))

// Arranque del modo local
const initial = useApp.getState()
if (initial.repo) initial.setUser(initial.user, initial.repo)

export function useViewDate(): ISODate {
  return useApp((s) => (s.viewingYesterday ? addDays(s.today, -1) : s.today))
}

// --- Navegación del calendario sobre el historial ---

function applyHistory(state: unknown) {
  const view = (state as { cal?: CalendarView; depth?: number } | null)
  useApp.setState({ calendar: view?.cal ?? null, calendarDepth: view?.depth ?? 0 })
}

window.addEventListener('popstate', (e) => applyHistory(e.state))
applyHistory(history.state)

export function openCalendar(view: CalendarView) {
  const depth = useApp.getState().calendarDepth + 1
  history.pushState({ cal: view, depth }, '')
  applyHistory({ cal: view, depth })
}

// Cambiar de año o de mes dentro del mismo nivel no añade entradas al historial
export function replaceCalendar(view: CalendarView) {
  const depth = useApp.getState().calendarDepth
  history.replaceState({ cal: view, depth }, '')
  applyHistory({ cal: view, depth })
}

// Sube "levels" niveles; con todos los niveles, cierra el calendario
export function calendarBack(levels: number) {
  if (levels > 0) history.go(-levels)
}

export function closeCalendar() {
  calendarBack(useApp.getState().calendarDepth)
}
