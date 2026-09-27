import { useState, type FormEvent } from 'react'
import { PASTELS, type Polarity } from '../domain/types'
import { Modal, SketchButton } from './Modal'
import { DotPreview } from './DotScale'
import { SketchBox } from './sketch'

export function ColorPalette({ value, onChange }: { value: string; onChange(c: string): void }) {
  return (
    <div className="palette" role="radiogroup" aria-label="Color del hábito">
      {PASTELS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={c === value}
          aria-label={`Color ${c}`}
          className={`swatch ${c === value ? 'selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  )
}

interface HabitEditorProps {
  title: string
  initialName?: string
  initialColor?: string
  onSave(name: string, color: string): void
  onClose(): void
}

export function HabitEditor({ title, initialName = '', initialColor = PASTELS[0], onSave, onClose }: HabitEditorProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), color)
    onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Nombre</span>
          <SketchBox seed="habit-name">
            <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Leer 20 páginas" required />
          </SketchBox>
        </label>
        <div className="field">
          <span>Color</span>
          <ColorPalette value={color} onChange={setColor} />
        </div>
        <div className="actions">
          <SketchButton seed="cancel" onClick={onClose}>Cancelar</SketchButton>
          <SketchButton seed="save" type="submit" variant="primary" disabled={!name.trim()}>Guardar</SketchButton>
        </div>
      </form>
    </Modal>
  )
}

interface MetricEditorProps {
  title: string
  initialName?: string
  initialPolarity?: Polarity
  lockPolarity?: boolean
  onSave(name: string, polarity: Polarity): void
  onClose(): void
}

export function MetricEditor({ title, initialName = '', initialPolarity = 'higher_better', lockPolarity, onSave, onClose }: MetricEditorProps) {
  const [name, setName] = useState(initialName)
  const [polarity, setPolarity] = useState<Polarity>(initialPolarity)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), polarity)
    onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Nombre</span>
          <SketchBox seed="metric-name">
            <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="Energía" required />
          </SketchBox>
        </label>
        {!lockPolarity && (
          <fieldset className="field polarity">
            <legend>Un valor alto es…</legend>
            <label className={polarity === 'higher_better' ? 'on' : ''}>
              <input type="radio" name="polarity" checked={polarity === 'higher_better'} onChange={() => setPolarity('higher_better')} />
              <span className="polarity-option">Bueno (más es mejor)<DotPreview polarity="higher_better" seed="prev-pos" /></span>
            </label>
            <label className={polarity === 'lower_better' ? 'on' : ''}>
              <input type="radio" name="polarity" checked={polarity === 'lower_better'} onChange={() => setPolarity('lower_better')} />
              <span className="polarity-option">Malo (más es peor)<DotPreview polarity="lower_better" seed="prev-neg" /></span>
            </label>
          </fieldset>
        )}
        <div className="actions">
          <SketchButton seed="cancel" onClick={onClose}>Cancelar</SketchButton>
          <SketchButton seed="save" type="submit" variant="primary" disabled={!name.trim()}>Guardar</SketchButton>
        </div>
      </form>
    </Modal>
  )
}

interface MenuOption {
  label: string
  hint?: string
  onSelect(): void
}

export function ActionMenu({ title, options, onClose }: { title: string; options: MenuOption[]; onClose(): void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="menu">
        {options.map((o, i) => (
          <SketchButton key={o.label} seed={`menu-${i}`} onClick={() => { onClose(); o.onSelect() }}>
            {o.label}
            {o.hint && <small className="hint">{o.hint}</small>}
          </SketchButton>
        ))}
        <SketchButton seed="menu-cancel" onClick={onClose}>Cancelar</SketchButton>
      </div>
    </Modal>
  )
}
