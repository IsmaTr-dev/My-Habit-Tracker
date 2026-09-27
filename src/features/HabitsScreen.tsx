import { useState } from 'react'
import { monthOf } from '../domain/dates'
import { activeHabitCount, newId } from '../domain/rules'
import { MAX_HABITS_PER_MONTH } from '../domain/types'
import { useApp, useViewDate } from '../store'
import { HabitEditor } from '../ui/editors'
import { Modal, SketchButton } from '../ui/Modal'
import { SketchBox } from '../ui/sketch'
import { Header } from './Chrome'
import { HabitChecklist } from './HabitChecklist'

export function HabitsScreen() {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const saveHabit = useApp((s) => s.saveHabit)
  const saveMonth = useApp((s) => s.saveMonth)
  const date = useViewDate()
  const page = data.months[monthOf(date)]
  const [adding, setAdding] = useState(false)
  const [editingMantra, setEditingMantra] = useState(false)

  const full = activeHabitCount(data, page) >= MAX_HABITS_PER_MONTH

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
        <HabitChecklist date={date} manage />
        <SketchButton
          seed="add-habit"
          className="add"
          onClick={() => setAdding(true)}
          disabled={full || !page}
          ariaLabel={full ? 'Máximo de 10 hábitos este mes' : 'Añadir hábito'}
        >
          {full ? 'Máximo 10 hábitos este mes' : '+'}
        </SketchButton>
        {data.habits && Object.keys(data.habits).length > 0 && (
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
