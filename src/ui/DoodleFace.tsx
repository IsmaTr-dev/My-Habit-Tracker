import { useMemo } from 'react'
import type { EmotionId } from '../domain/types'
import { gen, INK, Paths, seedOf } from './sketch'

// Caritas garabateadas a tinta, en un lienzo de 100×100 que se escala al tamaño pedido

type Shape = { kind: 'path'; d: string } | { kind: 'dot'; x: number; y: number; r: number } | { kind: 'ring'; x: number; y: number; r: number }

const FEATURES: Record<EmotionId, Shape[]> = {
  feliz: [
    { kind: 'path', d: 'M30 45 Q36 34 42 45' },
    { kind: 'path', d: 'M58 45 Q64 34 70 45' },
    { kind: 'path', d: 'M29 58 Q50 82 71 58' },
  ],
  tranquilo: [
    { kind: 'path', d: 'M30 43 Q36 49 42 43' },
    { kind: 'path', d: 'M58 43 Q64 49 70 43' },
    { kind: 'path', d: 'M38 64 Q50 72 62 64' },
  ],
  cansado: [
    { kind: 'path', d: 'M29 44 L43 44' },
    { kind: 'path', d: 'M31 44 Q36 50 41 44' },
    { kind: 'path', d: 'M57 44 L71 44' },
    { kind: 'path', d: 'M59 44 Q64 50 69 44' },
    { kind: 'ring', x: 50, y: 67, r: 5 },
    { kind: 'path', d: 'M74 14 L84 14 L74 24 L84 24' },
  ],
  ansioso: [
    { kind: 'ring', x: 36, y: 42, r: 5 },
    { kind: 'ring', x: 64, y: 42, r: 5 },
    { kind: 'path', d: 'M32 67 Q38 60 44 67 Q50 74 56 67 Q62 60 68 67' },
    { kind: 'path', d: 'M84 26 Q89 35 84 39 Q79 35 84 26' },
  ],
  triste: [
    { kind: 'dot', x: 37, y: 43, r: 3.5 },
    { kind: 'dot', x: 63, y: 43, r: 3.5 },
    { kind: 'path', d: 'M34 71 Q50 57 66 71' },
    { kind: 'path', d: 'M37 52 Q41 59 37 62 Q33 59 37 52' },
  ],
  enfadado: [
    { kind: 'path', d: 'M27 33 L44 40' },
    { kind: 'path', d: 'M73 33 L56 40' },
    { kind: 'dot', x: 37, y: 47, r: 3.5 },
    { kind: 'dot', x: 63, y: 47, r: 3.5 },
    { kind: 'path', d: 'M36 69 Q50 62 64 69' },
  ],
}

interface Props {
  emotion: EmotionId
  size: number
  // Sin cabeza: solo los rasgos (p. ej. dentro de una celda del calendario)
  head?: boolean
}

export function DoodleFace({ emotion, size, head = true }: Props) {
  const drawables = useMemo(() => {
    const seed = seedOf(emotion)
    // El trazo se define en unidades del lienzo: más grueso cuanto más pequeña se dibuja
    const stroke = { ...INK, strokeWidth: size < 32 ? 6 : 3.2, roughness: 0.9, bowing: 0.5 }
    const shapes = FEATURES[emotion].map((f, i) => {
      const o = { ...stroke, seed: seed + i }
      if (f.kind === 'path') return gen.path(f.d, o)
      if (f.kind === 'ring') return gen.circle(f.x, f.y, f.r * 2, o)
      return gen.circle(f.x, f.y, f.r * 2, { ...o, fill: 'var(--ink)', fillStyle: 'solid' })
    })
    return head ? [gen.circle(50, 50, 86, { ...stroke, seed: seed + 99 }), ...shapes] : shapes
  }, [emotion, size, head])

  return (
    <svg className="doodle-face" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" overflow="visible">
      {drawables.map((d, i) => <Paths key={i} drawable={d} />)}
    </svg>
  )
}
