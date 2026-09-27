import { dayOfMonth, monthDays, monthName, monthOf, WEEKDAYS_ES, weekdayMon0, addMonths } from '../domain/dates'
import { dayScore, scoreColor } from '../domain/mood'
import { isEditable } from '../domain/rules'
import { EMOTIONS, type DataState, type ISODate, type MonthKey } from '../domain/types'
import { calendarBack, openCalendar, replaceCalendar, useApp, type CalendarView } from '../store'
import { RibbonHandle } from './Chrome'
import { HabitChecklist } from './HabitChecklist'
import { MoodForm } from './MoodForm'
import { DoodleFace } from '../ui/DoodleFace'

// Leyenda generada desde la propia escala (con paradas intermedias, porque CSS interpola en RGB y la escala en HSL)
const LEGEND_GRADIENT = `linear-gradient(90deg, ${[0, 2.5, 5, 7.5, 10].map(scoreColor).join(', ')})`

const WEEKDAY_NAMES =['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function dayStyle(data: DataState, date: ISODate) {
  const score = dayScore(data.days[date], data.metrics)
  const emotion = EMOTIONS.find((e) => e.id === data.days[date]?.emotion)
  return { score, emotion, background: score === null ? undefined : scoreColor(score) }
}

// Hoja del calendario: se despliega desde la cinta y se cierra subiéndola
export function CalendarSheet({ view }: { view: CalendarView }) {
  return (
    <div className="calendar-sheet" role="dialog" aria-modal="true" aria-label="Calendario">
      {view.level !== 'year' && <Breadcrumbs view={view} />}
      <div className="calendar-body">
        {view.level === 'year' && <YearView year={view.year} />}
        {view.level === 'month' && <MonthView month={view.month} />}
        {view.level === 'day' && <DayView date={view.date} />}
      </div>
      <RibbonHandle mode="close" />
    </div>
  )
}

// Migas "2026 › Septiembre › 27": cada parte sube a ese nivel
function Breadcrumbs({ view }: { view: CalendarView }) {
  const depthOf = { year: 0, month: 1, day: 2 } as const
  const current = depthOf[view.level]
  const date = view.level === 'day' ? view.date : undefined
  const month = view.level === 'month' ? view.month : date ? monthOf(date) : undefined
  const year = view.level === 'year' ? view.year : Number((month ?? '').slice(0, 4))

  const crumb = (label: string, level: 0 | 1 | 2) =>
    level < current ? (
      <button type="button" className="crumb" onClick={() => calendarBack(current - level)}>{label}</button>
    ) : (
      <span className="crumb current" aria-current="page">{label}</span>
    )

  return (
    <nav className="breadcrumbs" aria-label="Ruta del calendario">
      {crumb(String(year), 0)}
      {month && <><span aria-hidden="true"> › </span>{crumb(monthName(month), 1)}</>}
      {date && <><span aria-hidden="true"> › </span>{crumb(String(dayOfMonth(date)), 2)}</>}
    </nav>
  )
}

function YearView({ year }: { year: number }) {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  const thisYear = Number(today.slice(0, 4))

  return (
    <>
      <div className="month-nav">
        <button type="button" className="arrow" onClick={() => replaceCalendar({ level: 'year', year: year - 1 })} aria-label="Año anterior">‹</button>
        <h2>{year}</h2>
        <button type="button" className="arrow" disabled={year >= thisYear} onClick={() => replaceCalendar({ level: 'year', year: year + 1 })} aria-label="Año siguiente">›</button>
      </div>
      <div className="year-grid">
        {months.map((m) => (
          <button key={m} type="button" className="mini-month" onClick={() => openCalendar({ level: 'month', month: m })} disabled={`${m}-01` > today}>
            <span className="mini-title">{monthName(m).slice(0, 3)}</span>
            <span className="mini-days" aria-hidden="true">
              {Array.from({ length: weekdayMon0(`${m}-01`) }, (_, i) => <i key={`b${i}`} className="blank" />)}
              {monthDays(m).map((d) => (
                <i key={d} className={d > today ? 'future' : ''} style={{ background: dayStyle(data, d).background }} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function MonthView({ month }: { month: MonthKey }) {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const canNext = month < monthOf(today)

  return (
    <>
      <div className="month-nav">
        <button type="button" className="arrow" onClick={() => replaceCalendar({ level: 'month', month: addMonths(month, -1) })} aria-label="Mes anterior">‹</button>
        <h2>{monthName(month)}</h2>
        <button type="button" className="arrow" disabled={!canNext} onClick={() => replaceCalendar({ level: 'month', month: addMonths(month, 1) })} aria-label="Mes siguiente">›</button>
      </div>
      <div className="month-grid">
        {WEEKDAYS_ES.map((w) => <span key={w} className="wd">{w}</span>)}
        {Array.from({ length: weekdayMon0(`${month}-01`) }, (_, i) => <span key={`b${i}`} />)}
        {monthDays(month).map((d) => {
          const { score, emotion, background } = dayStyle(data, d)
          const future = d > today
          return (
            <button
              key={d}
              type="button"
              className={`day-cell ${future ? 'future' : ''} ${d === today ? 'today' : ''}`}
              style={background ? { ['--bg' as string]: background } : undefined}
              disabled={future}
              onClick={() => openCalendar({ level: 'day', date: d })}
              aria-label={`${dayOfMonth(d)} de ${monthName(month)}${score !== null ? `, ánimo ${score.toFixed(1)}` : ''}${emotion ? `, ${emotion.label}` : ''}`}
            >
              <span className="num">{dayOfMonth(d)}</span>
              {score === null && emotion && <DoodleFace emotion={emotion.id} size={26} head={false} />}
            </button>
          )
        })}
      </div>
      <div className="legend" aria-hidden="true">
        <span>0</span><span className="legend-bar" style={{ background: LEGEND_GRADIENT }} /><span>10</span>
      </div>
    </>
  )
}

function DayView({ date }: { date: ISODate }) {
  const today = useApp((s) => s.today)
  const editable = isEditable(date, today)
  return (
    <div className="day-view">
      <h2 className="day-title">
        {WEEKDAY_NAMES[weekdayMon0(date)]}, {dayOfMonth(date)} de {monthName(monthOf(date)).toLowerCase()}
      </h2>
      <p className="day-status">{editable ? 'Puedes editar este día' : 'Solo lectura'}</p>
      <section aria-label="Hábitos">
        <h3>Hábitos</h3>
        <HabitChecklist date={date} readOnly={!editable} />
      </section>
      <section aria-label="Ánimo">
        <h3>Ánimo</h3>
        <MoodForm key={date} date={date} readOnly={!editable} />
      </section>
    </div>
  )
}
