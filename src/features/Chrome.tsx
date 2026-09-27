import { useRef, useState, type ReactNode } from 'react'
import { dayOfMonth, monthName, monthOf } from '../domain/dates'
import { closeCalendar, openCalendar, useApp, useViewDate, type Tab } from '../store'
import { Ribbon, SketchBox } from '../ui/sketch'

const HINT_KEY = 'cuaderno:cinta-vista'

function ribbonHintSeen(): boolean {
  try { return localStorage.getItem(HINT_KEY) === '1' } catch { return true }
}

function markRibbonHintSeen() {
  try { localStorage.setItem(HINT_KEY, '1') } catch { /* sin almacenamiento: la pista volverá a salir */ }
}

// Cinta marcapáginas: se toca o se arrastra (hacia abajo para abrir, hacia arriba para cerrar)
export function RibbonHandle({ mode }: { mode: 'open' | 'close' }) {
  const today = useApp((s) => s.today)
  const startY = useRef<number | null>(null)
  const actedByDrag = useRef(false)
  const [peek] = useState(() => mode === 'open' && !ribbonHintSeen())

  const act = () => {
    if (mode === 'open') {
      markRibbonHintSeen()
      openCalendar({ level: 'year', year: Number(today.slice(0, 4)) })
    } else {
      closeCalendar()
    }
  }

  return (
    <button
      type="button"
      className={`ribbon ribbon-${mode} ${peek ? 'peek' : ''}`}
      aria-label={mode === 'open' ? 'Abrir calendario' : 'Cerrar calendario'}
      onClick={() => {
        // El arrastre ya actuó: se ignora el click que el navegador dispara al soltar
        if (actedByDrag.current) { actedByDrag.current = false; return }
        act()
      }}
      onPointerDown={(e) => { startY.current = e.clientY; actedByDrag.current = false }}
      onPointerUp={(e) => {
        if (startY.current === null) return
        const dy = e.clientY - startY.current
        startY.current = null
        if ((mode === 'open' && dy > 30) || (mode === 'close' && dy < -30)) {
          actedByDrag.current = true
          act()
        }
      }}
    >
      <Ribbon length={mode === 'open' ? 64 : 52} />
    </button>
  )
}

interface HeaderProps {
  dayNav?: boolean
  children?: ReactNode
}

// Cabecera común: mes, día (con ‹ › para ayer) y cinta del calendario
export function Header({ dayNav, children }: HeaderProps) {
  const today = useApp((s) => s.today)
  const viewingYesterday = useApp((s) => s.viewingYesterday)
  const setViewingYesterday = useApp((s) => s.setViewingYesterday)
  const date = useViewDate()
  const shown = dayNav ? date : today

  return (
    <header className={`header ${dayNav && viewingYesterday ? 'yesterday' : ''}`}>
      <div className="header-row">
        <h1 className="month-title">{monthName(monthOf(shown))}</h1>
        <div className="day-nav">
          {dayNav && !viewingYesterday && (
            <button type="button" className="arrow" aria-label="Ver ayer" onClick={() => setViewingYesterday(true)}>‹</button>
          )}
          <span className="day-number" aria-label={`Día ${dayOfMonth(shown)}`}>{dayOfMonth(shown)}</span>
          {dayNav && viewingYesterday && (
            <button type="button" className="arrow" aria-label="Volver a hoy" onClick={() => setViewingYesterday(false)}>›</button>
          )}
        </div>
      </div>
      {dayNav && viewingYesterday && <span className="stamp" role="status">Ayer</span>}
      {children}
      <RibbonHandle mode="open" />
    </header>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'habitos', label: 'Hábitos' },
  { id: 'stats', label: 'Stats' },
  { id: 'animo', label: 'Ánimo' },
]

export function BottomNav() {
  const tab = useApp((s) => s.tab)
  const setTab = useApp((s) => s.setTab)
  return (
    <nav className="bottom-nav" aria-label="Secciones">
      {TABS.map((t) => (
        <button key={t.id} type="button" className="tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
          <SketchBox seed={`tab-${t.id}`} radius={10} fill={tab === t.id ? 'var(--pencil-fill)' : undefined}>
            <span>{t.label}</span>
          </SketchBox>
        </button>
      ))}
    </nav>
  )
}
