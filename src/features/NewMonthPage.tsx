import { useState } from 'react'
import { addMonths, monthLabel } from '../domain/dates'
import { newId } from '../domain/rules'
import { MAX_HABITS_PER_MONTH, PASTELS, type Habit, type MonthKey } from '../domain/types'
import { useApp } from '../store'
import { HabitEditor } from '../ui/editors'
import { SketchButton } from '../ui/Modal'
import { SketchBox } from '../ui/sketch'

interface Draft {
  id: string
  name: string
  color: string
  existing?: Habit
}

// "Página nueva" del cuaderno: mantra + hábitos copiados del mes anterior
export function NewMonthPage({ month }: { month: MonthKey }) {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const saveHabit = useApp((s) => s.saveHabit)
  const saveMonth = useApp((s) => s.saveMonth)
  const firstTime = Object.keys(data.habits).length === 0

  const [mantra, setMantra] = useState(data.months[month]?.mantra ?? '')
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const prev = data.months[addMonths(month, -1)]
    return (prev?.habitIds ?? [])
      .map((id) => data.habits[id])
      .filter((h): h is Habit => !!h && !h.archivedAt)
      .map((h) => ({ id: h.id, name: h.name, color: h.color, existing: h }))
  })
  const [editing, setEditing] = useState<Draft | 'new' | null>(null)

  const full = drafts.length >= MAX_HABITS_PER_MONTH

  const saveDraft = (name: string, color: string) => {
    if (editing === 'new') setDrafts((d) => [...d, { id: newId(), name, color }])
    else if (editing) setDrafts((d) => d.map((x) => (x.id === editing.id ? { ...x, name, color } : x)))
  }

  const start = () => {
    drafts.forEach((d, i) => {
      if (!d.existing) saveHabit({ id: d.id, name: d.name, color: d.color, order: i, createdAt: today })
      else if (d.existing.name !== d.name || d.existing.color !== d.color) saveHabit({ ...d.existing, name: d.name, color: d.color })
    })
    saveMonth({ id: month, mantra: mantra.trim(), habitIds: drafts.map((d) => d.id), setupDone: true })
  }

  return (
    <main className="screen new-month">
      <p className="kicker">{firstTime ? 'Tu cuaderno empieza aquí' : 'Página nueva'}</p>
      <h1 className="month-title">{monthLabel(month)}</h1>
      {firstTime && <p className="intro">Cada mes es una hoja nueva: escribe un mantra y apunta los hábitos que quieres seguir.</p>}

      <label className="field">
        <span>Mantra del mes</span>
        <SketchBox seed="nm-mantra">
          <input value={mantra} maxLength={80} onChange={(e) => setMantra(e.target.value)} placeholder="Lo que no cambias, lo eliges" />
        </SketchBox>
        <small className="hint">Opcional: puedes escribirlo más tarde tocando la cabecera.</small>
      </label>

      <div className="field">
        <span>Hábitos {drafts.length > 0 && `(${drafts.length}/${MAX_HABITS_PER_MONTH})`}</span>
        <ul className="draft-list">
          {drafts.map((d) => (
            <li key={d.id}>
              <SketchBox seed={`draft-${d.id}`}>
                <button type="button" className="draft-edit" onClick={() => setEditing(d)} aria-label={`Editar ${d.name}`}>
                  <span className="dot" style={{ background: d.color }} aria-hidden="true" />
                  {d.name}
                </button>
                <button type="button" className="remove" onClick={() => setDrafts((x) => x.filter((y) => y.id !== d.id))} aria-label={`Quitar ${d.name}`}>×</button>
              </SketchBox>
            </li>
          ))}
        </ul>
        <SketchButton seed="nm-add" className="add" onClick={() => setEditing('new')} disabled={full}>
          {full ? 'Máximo 10 hábitos' : '+ Añadir hábito'}
        </SketchButton>
      </div>

      <SketchButton seed="nm-start" variant="primary" className="start" onClick={start} disabled={drafts.length === 0}>
        Empezar el mes
      </SketchButton>

      {editing && (
        <HabitEditor
          title={editing === 'new' ? 'Nuevo hábito' : 'Editar hábito'}
          initialName={editing === 'new' ? '' : editing.name}
          initialColor={editing === 'new' ? PASTELS[drafts.length % PASTELS.length] : editing.color}
          onSave={saveDraft}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  )
}
