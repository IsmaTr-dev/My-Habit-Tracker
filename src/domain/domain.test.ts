import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysInMonth, logicalToday, monthDays, monthLabel, weekdayMon0 } from './dates'
import { dayScore, scoreColor } from './mood'
import { habitsForDay, isEditable } from './rules'
import { bestStreakInMonth, currentStreak, habitMonthStats } from './stats'
import type { DataState, DayEntry, Habit, MoodMetric } from './types'

describe('dates', () => {
  it('el día lógico cambia a las 04:00', () => {
    expect(logicalToday(new Date(2026, 8, 27, 3, 59))).toBe('2026-09-26')
    expect(logicalToday(new Date(2026, 8, 27, 4, 0))).toBe('2026-09-27')
    expect(logicalToday(new Date(2026, 9, 1, 0, 30))).toBe('2026-09-30')
  })

  it('suma días cruzando meses, años y cambios de horario', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })

  it('calcula meses', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(monthDays('2026-09')).toHaveLength(30)
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(monthLabel('2026-09')).toBe('Septiembre 2026')
  })

  it('la semana empieza en lunes', () => {
    expect(weekdayMon0('2026-09-01')).toBe(1) // martes
    expect(weekdayMon0('2026-09-27')).toBe(6) // domingo
  })
})

const habit = (over: Partial<Habit> = {}): Habit => ({
  id: 'agua', name: 'Agua', color: '#a7c7ec', order: 0, createdAt: '2026-09-01', ...over,
})

const daysDone = (id: string, dates: string[]): Record<string, DayEntry> =>
  Object.fromEntries(dates.map((d) => [d, { id: d, habitsDone: { [id]: true } }]))

describe('stats', () => {
  it('el % del mes en curso cuenta hasta ayer y suma hoy solo si está marcado', () => {
    const days = daysDone('agua', ['2026-09-01', '2026-09-02', '2026-09-03'])
    expect(habitMonthStats(habit(), '2026-09', days, '2026-09-04')).toEqual({ done: 3, valid: 3, pct: 100 })
    const withToday = daysDone('agua', ['2026-09-01', '2026-09-04'])
    expect(habitMonthStats(habit(), '2026-09', withToday, '2026-09-04')).toEqual({ done: 2, valid: 4, pct: 50 })
  })

  it('un hábito creado a mitad de mes cuenta desde su creación', () => {
    const days = daysDone('agua', ['2026-09-15'])
    expect(habitMonthStats(habit({ createdAt: '2026-09-15' }), '2026-09', days, '2026-09-17'))
      .toEqual({ done: 1, valid: 2, pct: 50 })
  })

  it('un mes cerrado se calcula sobre todos sus días', () => {
    const days = daysDone('agua', monthDays('2026-09').slice(0, 15))
    expect(habitMonthStats(habit(), '2026-09', days, '2026-10-10')).toEqual({ done: 15, valid: 30, pct: 50 })
  })

  it('un hábito archivado deja de contar tras el día de archivo', () => {
    const days = daysDone('agua', ['2026-09-01'])
    expect(habitMonthStats(habit({ archivedAt: '2026-09-03' }), '2026-09', days, '2026-09-20'))
      .toEqual({ done: 1, valid: 2, pct: 50 })
  })

  it('sin días válidos no hay porcentaje', () => {
    expect(habitMonthStats(habit(), '2026-09', {}, '2026-09-01').pct).toBeNull()
  })

  it('la racha actual llega hasta ayer si hoy no está marcado y cruza meses', () => {
    const days = daysDone('agua', ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'])
    expect(currentStreak(habit({ createdAt: '2026-08-01' }), days, '2026-09-03')).toBe(4)
    expect(currentStreak(habit({ createdAt: '2026-08-01' }), days, '2026-09-04')).toBe(0)
  })

  it('la mejor racha es la más larga del mes', () => {
    const days = daysDone('agua', ['2026-09-01', '2026-09-02', '2026-09-05', '2026-09-06', '2026-09-07'])
    expect(bestStreakInMonth(habit(), '2026-09', days, '2026-09-27')).toBe(3)
  })
})

describe('mood', () => {
  const metrics: Record<string, MoodMetric> = {
    mot: { id: 'mot', name: 'Motivación', polarity: 'higher_better', order: 0, createdAt: '2026-09-01' },
    per: { id: 'per', name: 'Pereza', polarity: 'lower_better', order: 1, createdAt: '2026-09-01' },
  }

  it('invierte los ítems negativos antes de promediar', () => {
    expect(dayScore({ id: 'd', ratings: { mot: 6, per: 8 } }, metrics)).toBe(4)
  })

  it('ignora los ítems sin valorar y sin notas no hay puntuación', () => {
    expect(dayScore({ id: 'd', ratings: { mot: 9 } }, metrics)).toBe(9)
    expect(dayScore({ id: 'd', emotion: 'feliz' }, metrics)).toBeNull()
  })

  // Luminancia relativa WCAG: lo que percibe el ojo (la "L" de HSL no sirve, un amarillo al 63 % es mucho más claro que un rojo al 63 %)
  const lum = ([r, g, b]: number[]) => {
    const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const hslToRgb = (c: string) => {
    const [h, s, l] = (c.match(/[\d.]+/g) ?? []).map(Number)
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
    const k = (n: number) => (n + h / 30) % 12
    return [0, 8, 4].map((n) => l / 100 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))
  }
  const scoreLum = (score: number) => lum(hslToRgb(scoreColor(score)))

  it('la escala gana luminosidad de rojo a verde', () => {
    expect(scoreLum(0)).toBeLessThan(scoreLum(5))
    expect(scoreLum(5)).toBeLessThan(scoreLum(10))
  })

  it('la tinta (--ink) se lee sobre cualquier color de la escala (WCAG AA, 4,5:1)', () => {
    const ink = lum([0x2b, 0x2a, 0x27].map((v) => v / 255))
    for (let i = 0; i <= 100; i++) {
      expect((scoreLum(i / 10) + 0.05) / (ink + 0.05)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('rules', () => {
  it('solo hoy y ayer son editables', () => {
    expect(isEditable('2026-09-27', '2026-09-27')).toBe(true)
    expect(isEditable('2026-09-26', '2026-09-27')).toBe(true)
    expect(isEditable('2026-09-25', '2026-09-27')).toBe(false)
    expect(isEditable('2026-09-28', '2026-09-27')).toBe(false)
  })

  it('un hábito archivado desaparece desde el día de archivo', () => {
    const state: DataState = {
      habits: { agua: habit({ archivedAt: '2026-09-10' }) },
      months: { '2026-09': { id: '2026-09', habitIds: ['agua'], setupDone: true } },
      days: {},
      metrics: {},
    }
    expect(habitsForDay(state, '2026-09-09')).toHaveLength(1)
    expect(habitsForDay(state, '2026-09-10')).toHaveLength(0)
  })
})
