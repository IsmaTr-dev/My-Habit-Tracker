// Tipos del dominio. Las fechas se guardan siempre como "día lógico" en formato YYYY-MM-DD
// y los meses como YYYY-MM (ver dates.ts).

export type ISODate = string
export type MonthKey = string

export interface Habit {
  id: string
  name: string
  color: string
  order: number
  createdAt: ISODate
  archivedAt?: ISODate | null
}

export interface MonthPage {
  id: MonthKey
  mantra?: string
  habitIds: string[]
  setupDone: boolean
}

export type Polarity = 'higher_better' | 'lower_better'

export interface MoodMetric {
  id: string
  name: string
  polarity: Polarity
  order: number
  createdAt: ISODate
  archivedAt?: ISODate | null
}

export type EmotionId = 'feliz' | 'triste' | 'enfadado' | 'cansado' | 'ansioso' | 'tranquilo'

export interface DayEntry {
  id: ISODate
  habitsDone?: Record<string, boolean>
  sentence?: string
  emotion?: EmotionId | null
  // Un rating ausente significa "sin valorar"
  ratings?: Record<string, number>
  notes?: string
  updatedAt?: number
}

export interface DataState {
  habits: Record<string, Habit>
  months: Record<MonthKey, MonthPage>
  days: Record<ISODate, DayEntry>
  metrics: Record<string, MoodMetric>
}

export const EMPTY_STATE: DataState = { habits: {}, months: {}, days: {}, metrics: {} }

export const EMOTIONS: ReadonlyArray<{ id: EmotionId; label: string }> = [
  { id: 'feliz', label: 'Feliz' },
  { id: 'tranquilo', label: 'Tranquilo' },
  { id: 'cansado', label: 'Cansado' },
  { id: 'ansioso', label: 'Ansioso' },
  { id: 'triste', label: 'Triste' },
  { id: 'enfadado', label: 'Enfadado' },
]

// Paleta pastel de rotulador para los hábitos (10 colores = límite de hábitos por mes)
export const PASTELS: ReadonlyArray<string> = [
  '#f4a6a6', '#f7c59f', '#f3dd8c', '#bfe0a3', '#9fd8c8',
  '#a7c7ec', '#c4b5f0', '#eab3d8', '#d9c3a5', '#b9c4cf',
]

export const MAX_HABITS_PER_MONTH = 10
export const SENTENCE_MAX = 80

export const SUGGESTED_METRICS: ReadonlyArray<{ name: string; polarity: Polarity }> = [
  { name: 'Motivación', polarity: 'higher_better' },
  { name: 'Felicidad', polarity: 'higher_better' },
  { name: 'Pereza', polarity: 'lower_better' },
]
