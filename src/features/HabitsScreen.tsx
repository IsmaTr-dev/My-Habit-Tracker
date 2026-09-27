import { useState } from 'react'
import { monthOf } from '../domain/dates'
import { activeHabitCount, habitsForDay, newId } from '../domain/rules'
import { isDone } from '../domain/stats'
import { MAX_HABITS_PER_MONTH } from '../domain/types'
import { useApp, useViewDate } from '../store'
import { HabitEditor } from '../ui/editors'
import { hintSeen, markHintSeen } from '../ui/hints'
import { Modal, SketchButton } from '../ui/Modal'
import { SketchBox } from '../ui/sketch'
import { Header } from './Chrome'
import { HabitChecklist } from './HabitChecklist'

const LONG_PRESS_HINT = 'cuaderno:pulsacion-larga-vista'

export function HabitsScreen() {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const saveHabit = useApp((s) => s.saveHabit)
  const saveMonth = useApp((s) => s.saveMonth)
  const date = useViewDate()
  const page = data.months[monthOf(date)]
  const [adding, setAdding] = useState(false)
  const [editingMantra, setEditingMantra] = useState(false)
  // La pista de la pulsación larga desaparece en cuanto se usa una vez
  const [showTip, setShowTip] = useState(() => !hintSeen(LONG_PRESS_HINT))

  const full = activeHabitCount(data, page) >= MAX_HABITS_PER_MONTH
  const dayHabits = habitsForDay(data, date)
  const doneCount = dayHabits.filter((h) => isDone(data.days, date, h.id)).length

  const learnedLongPress = () => {
    if (!showTip) return
    markHintSeen(LONG_PRESS_HINT)
    setShowTip(false)
  }

  const addHabit = (name: string, color: string) => {
    if (!page) return
    const id = newId()
    const order = Object.keys(data.habits).length
    // Añadido "ayer", cuenta desde ayer; añadido hoy, desde hoy
    saveHabit({ id, name, color, order, createdAt: date < today ? date : today })
    saveMonth({ ...page, habitIds: [...page.habitIds, id] })
  }

  return (
    <>
      <Header dayNav>
        <button type="button" className={`mantra ${page?.mantra ? '' : 'placeholder'}`} onClick={() => setEditingMantra(true)}>
          {page?.mantra || 'Escribe tu mantra…'}
        </button>
      </Header>
      <main className="screen">
        {dayHabits.length > 0 && (
          <p className="day-progress">
            {doneCount} de {dayHabits.length} hechos{doneCount === dayHabits.length && ' · día completo'}
          </p>
        )}
        <HabitChecklist date={date} manage onManaged={learnedLongPress} />
        <SketchButton
          seed="add-habit"
          className="add"
          onClick={() => setAdding(true)}
          disabled={full || !page}
        >
          {full ? 'Máximo 10 hábitos este mes' : '+ Añadir hábito'}
        </SketchButton>
        {showTip && dayHabits.length > 0 && (
          <p className="tip">Mantén pulsado un hábito para editarlo, archivarlo o moverlo.</p>
        )}
      </main>

      {adding && <HabitEditor title="Nuevo hábito" onSave={addHabit} onClose={() => setAdding(false)} />}
      {editingMantra && page && (
        <MantraEditor initial={page.mantra ?? ''} onSave={(mantra) => saveMonth({ ...page, mantra })} onClose={() => setEditingMantra(false)} />
      )}
    </>
  )
}

function MantraEditor({ initial, onSave, onClose }: { initial: string; onSave(m: string): void; onClose(): void }) {
  const [value, setValue] = useState(initial)
  return (
    <Modal title="Mantra del mes" onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(value.trim()); onClose() }}>
        <SketchBox seed="mantra-input">
          <input value={value} maxLength={80} onChange={(e) => setValue(e.target.value)} placeholder="Lo que no cambias, lo eliges" aria-label="Mantra" />
        </SketchBox>
        <div className="actions">
          <SketchButton seed="cancel" onClick={onClose}>Cancelar</SketchButton>
          <SketchButton seed="save" type="submit" variant="primary">Guardar</SketchButton>
        </div>
      </form>
    </Modal>
  )
}
