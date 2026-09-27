import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { scoreColor } from '../domain/mood'
import type { Polarity } from '../domain/types'
import { gen, INK, Paths, seedOf, useSize } from './sketch'

const STEPS = 11 // de 0 a 10
const HEIGHT = 36

interface Props {
  label: string
  polarity: Polarity
  value: number | undefined
  readOnly?: boolean
  seed: string
  onChange(v: number): void
}

// Escala de puntos tipo bullet journal: once círculos a mano que se rellenan hasta la nota.
// El relleno usa el color de la escala de ánimo teniendo en cuenta la polaridad del ítem.
export function DotScale({ label, polarity, value, readOnly, seed, onChange }: Props) {
  const [ref, { w }] = useSize<HTMLDivElement>()
  const [preview, setPreview] = useState<number | null>(null)
  const dragging = useRef(false)
  const shown = preview ?? value
  const cell = w / STEPS

  const color = shown === undefined ? 'none' : scoreColor(polarity === 'lower_better' ? 10 - shown : shown)
  const s = seedOf(seed)
  const d = Math.min(cell - 6, 24)

  const rings = useMemo(
    () => (w ? Array.from({ length: STEPS }, (_, i) => gen.circle(cell * i + cell / 2, HEIGHT / 2, d, { ...INK, strokeWidth: 1.3, seed: s + i })) : []),
    [w, cell, d, s],
  )
  const blobs = useMemo(
    () => (w && shown !== undefined
      ? Array.from({ length: shown + 1 }, (_, i) =>
        gen.circle(cell * i + cell / 2, HEIGHT / 2, d - 5, { stroke: 'none', fill: color, fillStyle: 'solid', roughness: 1.4, seed: s + 40 + i }))
      : []),
    [w, cell, d, s, shown, color],
  )

  const indexAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return 0
    return Math.max(0, Math.min(STEPS - 1, Math.floor(((clientX - box.left) / box.width) * STEPS)))
  }

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (readOnly) return
    dragging.current = true
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    setPreview(indexAt(e.clientX))
  }
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (dragging.current) setPreview(indexAt(e.clientX))
  }
  // Se guarda al soltar, no en cada movimiento del dedo
  const commit = () => {
    if (!dragging.current) return
    dragging.current = false
    if (preview !== null && preview !== value) onChange(preview)
    setPreview(null)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (readOnly) return
    const current = value ?? 5
    const next = { ArrowRight: current + 1, ArrowUp: current + 1, ArrowLeft: current - 1, ArrowDown: current - 1, Home: 0, End: 10 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(Math.max(0, Math.min(10, next)))
  }

  return (
    <div
      ref={ref}
      className={`dot-scale ${shown === undefined ? 'unset' : ''}`}
      role="slider"
      tabIndex={readOnly ? -1 : 0}
      aria-label={`${label} (${polarity === 'higher_better' ? 'más es mejor' : 'más es peor'})`}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
      aria-valuetext={value === undefined ? 'Sin valorar' : String(value)}
      aria-readonly={readOnly}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={commit}
      onPointerCancel={commit}
      onKeyDown={onKeyDown}
    >
      <svg width={w} height={HEIGHT} aria-hidden="true" overflow="visible">
        {blobs.map((b, i) => <Paths key={`b${i}`} drawable={b} />)}
        {rings.map((r, i) => <Paths key={`r${i}`} drawable={r} />)}
      </svg>
    </div>
  )
}

// Miniatura estática de la escala para el editor de ítems: una nota alta (8)
// pintada con el color que tendría según la polaridad (verde si es buena, rojo si es mala)
export function DotPreview({ polarity, seed }: { polarity: Polarity; seed: string }) {
  const value = 8
  const cell = 17
  const h = 18
  const s = seedOf(seed)
  const color = scoreColor(polarity === 'lower_better' ? 10 - value : value)
  const drawables = useMemo(
    () => Array.from({ length: STEPS }, (_, i) => {
      const x = cell * i + cell / 2
      const ring = gen.circle(x, h / 2, 13, { ...INK, strokeWidth: 1.1, roughness: 0.9, seed: s + i })
      return i <= value
        ? [gen.circle(x, h / 2, 9, { stroke: 'none', fill: color, fillStyle: 'solid', roughness: 1.2, seed: s + 40 + i }), ring]
        : [ring]
    }).flat(),
    [s, color],
  )
  return (
    <svg className="dot-preview" width={cell * STEPS} height={h} aria-hidden="true" overflow="visible">
      {drawables.map((d, i) => <Paths key={i} drawable={d} />)}
    </svg>
  )
}
