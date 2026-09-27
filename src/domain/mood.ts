import type { DayEntry, MoodMetric } from './types'

// Media de los ítems valorados; los de polaridad negativa se invierten (Pereza 8 cuenta como 2)
export function dayScore(entry: DayEntry | undefined, metrics: Record<string, MoodMetric>): number | null {
  if (!entry?.ratings) return null
  const values = Object.entries(entry.ratings)
    .filter(([id, v]) => metrics[id] && typeof v === 'number')
    .map(([id, v]) => (metrics[id].polarity === 'lower_better' ? 10 - v : v))
  if (!values.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

// Escala rojo → amarillo → verde con luminosidad creciente, legible con daltonismo rojo-verde
const STOPS: ReadonlyArray<[number, number, number, number]> = [
  // [puntuación, tono, saturación, luminosidad]
  // Saturación contenida para convivir con los pasteles; rojo claro para que la tinta
  // mantenga ≥ 4,5:1 y verde más luminoso que el amarillo para separar ambos extremos
  [0, -4, 46, 66],
  [5, 42, 58, 62],
  [10, 135, 36, 78],
]

export function scoreColor(score: number): string {
  const s = Math.min(10, Math.max(0, score))
  const i = s <= 5 ? 0 : 1
  const [s0, h0, sa0, l0] = STOPS[i]
  const [s1, h1, sa1, l1] = STOPS[i + 1]
  const t = (s - s0) / (s1 - s0)
  const mix = (a: number, b: number) => a + (b - a) * t
  const hue = (mix(h0, h1) + 360) % 360
  return `hsl(${hue.toFixed(0)} ${mix(sa0, sa1).toFixed(0)}% ${mix(l0, l1).toFixed(0)}%)`
}
