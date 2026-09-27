import { useEffect, useRef, useState } from 'react'
import { activeMetrics, newId } from '../domain/rules'
import { EMOTIONS, SENTENCE_MAX, SUGGESTED_METRICS, type EmotionId, type ISODate, type MoodMetric, type Polarity } from '../domain/types'
import { useApp } from '../store'
import { ActionMenu, MetricEditor } from '../ui/editors'
import { Modal, SketchButton } from '../ui/Modal'
import { DoodleFace } from '../ui/DoodleFace'
import { DotScale } from '../ui/DotScale'
import { SketchArrow, SketchBox, SketchCircle } from '../ui/sketch'

const SAVE_DELAY_MS = 600

// Texto con autoguardado: guarda al dejar de escribir, al salir del campo y al desmontar
function useAutosave(initial: string, save: (v: string) => void) {
  const [value, setValue] = useState(initial)
  const pending = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const saveRef = useRef(save)
  saveRef.current = save

  const flush = () => {
    clearTimeout(timer.current)
    if (pending.current !== null) {
      saveRef.current(pending.current)
      pending.current = null
    }
  }

  useEffect(() => flush, [])

  const change = (v: string) => {
    setValue(v)
    pending.current = v
    clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
  }
  return { value, change, flush }
}

interface Props {
  date: ISODate
  readOnly?: boolean
}

// Se monta con key={date} para reiniciar los campos al cambiar de día
export function MoodForm({ date, readOnly }: Props) {
  const data = useApp((s) => s.data)
  const today = useApp((s) => s.today)
  const patchDay = useApp((s) => s.patchDay)
  const saveMetric = useApp((s) => s.saveMetric)
  const entry = data.days[date]
  const metrics = activeMetrics(data)

  const sentence = useAutosave(entry?.sentence ?? '', (v) => patchDay(date, { sentence: v }))
  const notes = useAutosave(entry?.notes ?? '', (v) => patchDay(date, { notes: v }))
  const [picking, setPicking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [menuFor, setMenuFor] = useState<MoodMetric | null>(null)
  const [renaming, setRenaming] = useState<MoodMetric | null>(null)

  const emotion = EMOTIONS.find((e) => e.id === entry?.emotion)

  const addMetric = (name: string, polarity: Polarity) => {
    const order = Object.keys(data.metrics).length
    saveMetric({ id: newId(), name, polarity, order, createdAt: today })
  }

  const setEmotion = (id: EmotionId) => {
    patchDay(date, { emotion: entry?.emotion === id ? null : id })
    setPicking(false)
  }

  return (
    <div className="mood">
      <div className="mood-top">
        <SketchBox seed="sentence" className="sentence">
          {readOnly ? (
            <p className="sentence-text">{sentence.value || <span className="hint">Sin frase</span>}</p>
          ) : (
            <input
              value={sentence.value}
              maxLength={SENTENCE_MAX}
              onChange={(e) => sentence.change(e.target.value)}
              onBlur={sentence.flush}
              placeholder="Tu día en una frase"
              aria-label="Tu día en una frase"
            />
          )}
        </SketchBox>
        <button
          type="button"
          className="emotion-button"
          onClick={() => !readOnly && setPicking(true)}
          aria-label={emotion ? `Emoción: ${emotion.label}. Cambiar` : 'Elegir emoción'}
          disabled={readOnly}
        >
          {emotion ? (
            <DoodleFace emotion={emotion.id} size={64} />
          ) : (
            <>
              <SketchCircle size={64} seed="emotion" />
              <span className="emotion-face" aria-hidden="true">?</span>
            </>
          )}
        </button>
      </div>

      {metrics.length === 0 ? (
        readOnly ? null : (
          <SketchBox seed="metrics-empty" className="metrics-empty">
            <p>Añade lo que quieras valorar cada día de 0 a 10. Por ejemplo:</p>
            <div className="chips">
              {SUGGESTED_METRICS.map((s) => (
                <button key={s.name} type="button" className="chip" onClick={() => addMetric(s.name, s.polarity)}>
                  + {s.name} <small>{s.polarity === 'higher_better' ? '(más es mejor)' : '(más es peor)'}</small>
                </button>
              ))}
            </div>
          </SketchBox>
        )
      ) : (
        <ul className="metric-list">
          {metrics.map((m) => (
            <MetricSlider
              key={m.id}
              metric={m}
              value={entry?.ratings?.[m.id]}
              readOnly={readOnly}
              onChange={(v) => patchDay(date, { ratings: { [m.id]: v } })}
              onLongPress={() => setMenuFor(m)}
            />
          ))}
        </ul>
      )}

      {!readOnly && (
        <SketchButton seed="add-metric" className="add small" onClick={() => setAdding(true)} ariaLabel="Añadir ítem de ánimo">+ Añadir ítem</SketchButton>
      )}

      <SketchBox seed="notes" className="notes">
        <textarea
          value={notes.value}
          onChange={(e) => notes.change(e.target.value)}
          onBlur={notes.flush}
          placeholder="Mis pensamientos…"
          aria-label="Mis pensamientos"
          readOnly={readOnly}
        />
      </SketchBox>

      {picking && (
        <Modal title="¿Cómo ha sido el día?" onClose={() => setPicking(false)}>
          <div className="emotion-grid">
            {EMOTIONS.map((e) => (
              <button key={e.id} type="button" className={`emotion-option ${entry?.emotion === e.id ? 'selected' : ''}`} onClick={() => setEmotion(e.id)} aria-pressed={entry?.emotion === e.id}>
                <DoodleFace emotion={e.id} size={52} />
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {adding && <MetricEditor title="Nuevo ítem de ánimo" onSave={addMetric} onClose={() => setAdding(false)} />}
      {menuFor && (
        <ActionMenu
          title={menuFor.name}
          onClose={() => setMenuFor(null)}
          options={[
            { label: 'Renombrar', onSelect: () => setRenaming(menuFor) },
            { label: 'Archivar ítem', hint: 'Deja de aparecer; su historial se conserva', onSelect: () => saveMetric({ ...menuFor, archivedAt: today }) },
          ]}
        />
      )}
      {renaming && (
        <MetricEditor
          title="Renombrar ítem"
          initialName={renaming.name}
          initialPolarity={renaming.polarity}
          lockPolarity
          onSave={(name) => saveMetric({ ...renaming, name })}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  )
}

interface SliderProps {
  metric: MoodMetric
  value: number | undefined
  readOnly?: boolean
  onChange(v: number): void
  onLongPress(): void
}

function MetricSlider({ metric, value, readOnly, onChange, onLongPress }: SliderProps) {
  const timer = useRef<number | undefined>(undefined)

  return (
    <li>
      <SketchBox seed={`metric-${metric.id}`} className="metric">
        <div className="metric-head">
          <span
            className="metric-name"
            onPointerDown={() => { if (!readOnly) timer.current = window.setTimeout(onLongPress, 450) }}
            onPointerUp={() => clearTimeout(timer.current)}
            onPointerLeave={() => clearTimeout(timer.current)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {metric.name}
            {/* La polaridad ya va en la etiqueta del slider: aquí es solo la pista visual */}
            <small className="polarity-hint" aria-hidden="true">
              <SketchArrow dir={metric.polarity === 'higher_better' ? 'up' : 'down'} seed={`arrow-${metric.id}`} />mejor
            </small>
          </span>
          <span className="metric-value" aria-hidden="true">{value ?? '–'}</span>
        </div>
        <DotScale
          label={metric.name}
          polarity={metric.polarity}
          value={value}
          readOnly={readOnly}
          seed={`dots-${metric.id}`}
          onChange={onChange}
        />
      </SketchBox>
    </li>
  )
}
