import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { monthOf } from '../domain/dates'
import { habitsForDay } from '../domain/rules'
import { isDone } from '../domain/stats'
import type { Habit, ISODate } from '../domain/types'
import { useApp } from '../store'
import { ActionMenu, HabitEditor } from '../ui/editors'
import { SketchBox, SketchCheck } from '../ui/sketch'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE = 8

interface Props {
  date: ISODate
  readOnly?: boolean
  // Pulsación larga: menú (editar/archivar) y arrastrar para reordenar
  manage?: boolean
}

interface DragState {
  id: string
  pointerId: number
  startY: number
  dy: number
  lifted: boolean
  moved: boolean
  rows: { id: string; mid: number }[]
}

export function HabitChecklist({ date, readOnly, manage }: Props) {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const patchDay = useApp((s) => s.patchDay)
  const saveHabit = useApp((s) => s.saveHabit)
  const saveMonth = useApp((s) => s.saveMonth)
  const habits = habitsForDay(data, date)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [menuFor, setMenuFor] = useState<Habit | null>(null)
  const [editing, setEditing] = useState<Habit | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const suppressClick = useRef(false)
  const listRef = useRef<HTMLUListElement>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag

  // Con el hábito "levantado", el dedo arrastra la fila en vez de hacer scroll
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const block = (e: TouchEvent) => { if (dragRef.current?.lifted) e.preventDefault() }
    el.addEventListener('touchmove', block, { passive: false })
    return () => el.removeEventListener('touchmove', block)
  }, [])

  const toggle = (h: Habit) => {
    if (readOnly) return
    if (suppressClick.current) { suppressClick.current = false; return }
    patchDay(date, { habitsDone: { [h.id]: !isDone(data.days, date, h.id) } })
  }

  const onPointerDown = (e: RPointerEvent, h: Habit) => {
    if (!manage || readOnly) return
    suppressClick.current = false
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-habit]') ?? []).map((el) => {
      const r = el.getBoundingClientRect()
      return { id: el.dataset.habit!, mid: r.top + r.height / 2 }
    })
    const state: DragState = { id: h.id, pointerId: e.pointerId, startY: e.clientY, dy: 0, lifted: false, moved: false, rows }
    setDrag(state)
    const target = e.currentTarget as HTMLElement
    timer.current = window.setTimeout(() => {
      try {
        target.setPointerCapture(state.pointerId)
      } catch {
        // El puntero ya no está activo: se sigue sin captura
      }
      navigator.vibrate?.(12)
      setDrag((d) => (d ? { ...d, lifted: true } : d))
    }, LONG_PRESS_MS)
  }

  const onPointerMove = (e: RPointerEvent) => {
    const d = dragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    const dy = e.clientY - d.startY
    if (!d.lifted) {
      if (Math.abs(dy) > MOVE_TOLERANCE) { clearTimeout(timer.current); setDrag(null) }
      return
    }
    setDrag({ ...d, dy, moved: d.moved || Math.abs(dy) > MOVE_TOLERANCE })
  }

  const onPointerUp = () => {
    clearTimeout(timer.current)
    const d = dragRef.current
    setDrag(null)
    if (!d?.lifted) return
    suppressClick.current = true
    const habit = habits.find((h) => h.id === d.id)
    if (!d.moved) { if (habit) setMenuFor(habit); return }
    reorder(d)
  }

  const reorder = (d: DragState) => {
    const page = data.months[monthOf(date)]
    if (!page) return
    const from = d.rows.find((r) => r.id === d.id)
    if (!from) return
    const y = from.mid + d.dy
    const others = d.rows.filter((r) => r.id !== d.id)
    const insertAt = others.filter((r) => r.mid < y).length
    const visibleOrder = others.map((r) => r.id)
    visibleOrder.splice(insertAt, 0, d.id)
    // Los hábitos no visibles (p. ej. archivados) conservan su sitio al final
    const rest = page.habitIds.filter((id) => !visibleOrder.includes(id))
    saveMonth({ ...page, habitIds: [...visibleOrder, ...rest] })
  }

  if (!habits.length) {
    return <p className="empty">{readOnly ? 'No había hábitos este día.' : 'Añade tu primer hábito con el botón +.'}</p>
  }

  return (
    <>
      <ul ref={listRef} className="habit-list">
        {habits.map((h) => {
          const done = isDone(data.days, date, h.id)
          const dragging = drag?.lifted && drag.id === h.id
          return (
            <li key={h.id} data-habit={h.id} style={dragging ? { transform: `translateY(${drag.dy}px)`, zIndex: 2 } : undefined}>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-disabled={readOnly}
                className={`habit-row ${dragging ? 'lifted' : ''}`}
                onClick={() => toggle(h)}
                onPointerDown={(e) => onPointerDown(e, h)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onContextMenu={(e) => manage && e.preventDefault()}
              >
                <SketchBox seed={`habit-${h.id}`} fill={done ? h.color : undefined}>
                  <span className="habit-name">{h.name}</span>
                  <SketchCheck checked={done} color={h.color} seed={`check-${h.id}`} />
                </SketchBox>
              </button>
            </li>
          )
        })}
      </ul>

      {menuFor && (
        <ActionMenu
          title={menuFor.name}
          onClose={() => setMenuFor(null)}
          options={[
            { label: 'Editar nombre y color', onSelect: () => setEditing(menuFor) },
            { label: 'Archivar hábito', hint: 'Desaparece desde hoy; su historial se conserva', onSelect: () => saveHabit({ ...menuFor, archivedAt: today }) },
          ]}
        />
      )}
      {editing && (
        <HabitEditor
          title="Editar hábito"
          initialName={editing.name}
          initialColor={editing.color}
          onSave={(name, color) => saveHabit({ ...editing, name, color })}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
