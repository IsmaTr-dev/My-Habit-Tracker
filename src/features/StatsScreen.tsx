import { useMemo, useRef, useState } from 'react'
import { addMonths, dayOfMonth, monthDays, monthLabel, monthOf, WEEKDAYS_ES, weekdayMon0 } from '../domain/dates'
import { habitsForMonth } from '../domain/rules'
import { bestStreakInMonth, currentStreak, habitMonthStats, isDone } from '../domain/stats'
import type { DataState, Habit, ISODate, MonthKey } from '../domain/types'
import { useApp } from '../store'
import { SketchBar, SketchBox } from '../ui/sketch'
import { Header } from './Chrome'

type View = 'pct' | 'grid'

const SWIPE_MIN = 60

export function StatsScreen() {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const month = useApp((s) => s.statsMonth)
  const setMonth = useApp((s) => s.setStatsMonth)
  const [view, setView] = useState<View>('pct')
  const start = useRef<{ x: number; y: number } | null>(null)

  const currentMonth = monthOf(today)
  const firstMonth = useMemo(() => Object.keys(data.months).sort()[0] ?? currentMonth, [data.months, currentMonth])
  const canPrev = month > firstMonth
  const canNext = month < currentMonth
  const go = (n: number) => {
    if ((n < 0 && canPrev) || (n > 0 && canNext)) setMonth(addMonths(month, n))
  }

  const habits = habitsForMonth(data, data.months[month])

  return (
    <>
      <Header />
      <main
        className="screen stats"
        onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => {
          if (!start.current) return
          const dx = e.clientX - start.current.x
          const dy = e.clientY - start.current.y
          start.current = null
          if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
        }}
      >
        <div className="month-nav">
          <button type="button" className="arrow" onClick={() => go(-1)} disabled={!canPrev} aria-label="Mes anterior">‹</button>
          <h2>{monthLabel(month)}</h2>
          <button type="button" className="arrow" onClick={() => go(1)} disabled={!canNext} aria-label="Mes siguiente">›</button>
        </div>

        <div className="segmented" role="tablist" aria-label="Tipo de vista">
          <SketchBox seed="segmented" radius={10}>
            <button type="button" role="tab" aria-selected={view === 'pct'} onClick={() => setView('pct')}>%</button>
            <span className="divider" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={view === 'grid'} onClick={() => setView('grid')}>Cuadrícula</button>
          </SketchBox>
        </div>

        {habits.length === 0 ? (
          <p className="empty">No hay hábitos en este mes.</p>
        ) : view === 'pct' ? (
          <PercentView habits={habits} data={data} month={month} today={today} />
        ) : (
          <GridView habits={habits} data={data} month={month} today={today} />
        )}
      </main>
    </>
  )
}

interface ViewProps {
  habits: Habit[]
  data: DataState
  month: MonthKey
  today: ISODate
}

function PercentView({ habits, data, month, today }: ViewProps) {
  return (
    <ul className="pct-list">
      {habits.map((h) => {
        const s = habitMonthStats(h, month, data.days, today)
        const streak = currentStreak(h, data.days, today)
        const best = bestStreakInMonth(h, month, data.days, today)
        return (
          <li key={h.id} className={h.archivedAt ? 'archived' : ''}>
            <div className="pct-head">
              <span className="pct-name">{h.name}{h.archivedAt && <small> (archivado)</small>}</span>
              <span className="pct-value">{s.pct === null ? '—' : `${s.pct}%`}</span>
            </div>
            <SketchBar pct={s.pct ?? 0} color={h.color} seed={`bar-${h.id}`} />
            <div className="pct-meta">
              <span>{s.done}/{s.valid} días</span>
              <span>Racha {streak} · mejor {best}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// La hoja clásica del cuaderno: días en filas y hábitos en columnas
function GridView({ habits, data, month, today }: ViewProps) {
  return (
    <div className="grid-wrap">
      <table className="habit-grid" style={{ ['--cols' as string]: habits.length }}>
        <thead>
          <tr>
            <th scope="col" className="day-col"><span className="sr-only">Día</span></th>
            {habits.map((h) => (
              <th key={h.id} scope="col"><span className="vertical">{h.name}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthDays(month).map((d) => (
            <tr key={d} className={weekdayMon0(d) === 6 ? 'sunday' : ''}>
              <th scope="row" className="day-col">
                <span className="wd">{WEEKDAYS_ES[weekdayMon0(d)]}</span>{dayOfMonth(d)}
              </th>
              {habits.map((h) => {
                const future = d > today
                const outside = d < h.createdAt || (!!h.archivedAt && d > h.archivedAt)
                const done = isDone(data.days, d, h.id)
                return (
                  <td
                    key={h.id}
                    className={future ? 'future' : outside ? 'outside' : done ? 'done' : ''}
                    style={done ? { ['--c' as string]: h.color } : undefined}
                    aria-label={`${h.name}, día ${dayOfMonth(d)}: ${future ? 'futuro' : done ? 'cumplido' : 'no cumplido'}`}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
