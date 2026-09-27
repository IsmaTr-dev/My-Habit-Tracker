import rough from 'roughjs'
import type { Options } from 'roughjs/bin/core'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

// Primitivas dibujadas a mano con rough.js (el motor de Excalidraw).
// Se generan paths SVG con semilla fija para que el trazo no "tiemble" en cada render.

export const gen = rough.generator()

export function seedOf(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return Math.abs(h) % 2 ** 31 || 1
}

export const INK: Options = { stroke: 'var(--ink)', strokeWidth: 1.4, roughness: 1.1, bowing: 0.8 }

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return `M${x + rr} ${y} H${x + w - rr} Q${x + w} ${y} ${x + w} ${y + rr} V${y + h - rr} Q${x + w} ${y + h} ${x + w - rr} ${y + h} H${x + rr} Q${x} ${y + h} ${x} ${y + h - rr} V${y + rr} Q${x} ${y} ${x + rr} ${y} Z`
}

// pathLength={1} normaliza la longitud del trazo para animarlo con stroke-dashoffset
export function Paths({ drawable, pathLength }: { drawable: ReturnType<typeof gen.path>; pathLength?: number }) {
  return (
    <>
      {gen.toPaths(drawable).map((p, i) => (
        // Estilo en línea (no atributos) para que funcionen las variables CSS de color
        <path key={i} d={p.d} pathLength={pathLength} style={{ stroke: p.stroke, strokeWidth: p.strokeWidth, fill: p.fill ?? 'none' }} strokeLinecap="round" />
      ))}
    </>
  )
}

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Tamaño de la caja completa (con padding): el trazo rodea todo el elemento
    const ro = new ResizeObserver(() => {
      const width = el.offsetWidth
      const height = el.offsetHeight
      setSize((s) => (Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

interface SketchBoxProps {
  seed: string
  radius?: number
  fill?: string
  fillStyle?: Options['fillStyle']
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

// Marco rectangular redondeado con trazo a mano alrededor de su contenido
export function SketchBox({ seed, radius = 12, fill, fillStyle = 'hachure', strokeWidth, className, style, children }: SketchBoxProps) {
  const [ref, { w, h }] = useSize<HTMLDivElement>()
  const drawable = useMemo(() => {
    if (!w || !h) return null
    return gen.path(roundedRect(2, 2, w - 4, h - 4, radius), {
      ...INK,
      ...(strokeWidth ? { strokeWidth } : {}),
      seed: seedOf(seed),
      fill,
      fillStyle,
      fillWeight: 1,
      hachureGap: 7,
      hachureAngle: -41,
    })
  }, [w, h, radius, fill, fillStyle, seed, strokeWidth])

  return (
    <div ref={ref} className={`sketch-box ${className ?? ''}`} style={style}>
      <svg className="sketch-svg" width={w} height={h} aria-hidden="true">
        {drawable && <Paths drawable={drawable} />}
      </svg>
      {children}
    </div>
  )
}

// Casilla de verificación dibujada: caja + tick de rotulador
// animate: el tick se dibuja y la mancha aparece (solo al marcar, no al montar la pantalla)
export function SketchCheck({ checked, color, seed, size = 30, animate }: { checked: boolean; color: string; seed: string; size?: number; animate?: boolean }) {
  const s = seedOf(seed)
  const box = useMemo(() => gen.path(roundedRect(3, 3, size - 6, size - 6, 6), { ...INK, seed: s }), [s, size])
  const tick = useMemo(
    () => gen.linearPath([[size * 0.22, size * 0.52], [size * 0.43, size * 0.74], [size * 0.8, size * 0.24]], {
      stroke: 'var(--ink)', strokeWidth: 2.6, roughness: 0.9, seed: s + 1,
    }),
    [s, size],
  )
  const blob = useMemo(
    () => gen.path(roundedRect(5, 5, size - 10, size - 10, 5), { stroke: 'none', fill: color, fillStyle: 'solid', roughness: 1.6, seed: s + 2 }),
    [s, size, color],
  )
  return (
    <svg className={`sketch-check ${animate ? 'animate' : ''}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {checked && <g className="blob"><Paths drawable={blob} /></g>}
      <Paths drawable={box} />
      {checked && <g className="tick"><Paths drawable={tick} pathLength={1} /></g>}
    </svg>
  )
}

// Barra de progreso con relleno rayado en el color del hábito
export function SketchBar({ pct, color, seed }: { pct: number; color: string; seed: string }) {
  const [ref, { w }] = useSize<HTMLDivElement>()
  const h = 26
  const s = seedOf(seed)
  const frame = useMemo(() => (w ? gen.path(roundedRect(2, 2, w - 4, h - 4, 8), { ...INK, seed: s }) : null), [w, s])
  const fillW = Math.max(0, ((w - 8) * pct) / 100)
  const bar = useMemo(
    () => (w && fillW > 2
      ? gen.rectangle(4, 5, fillW, h - 10, {
        // Rayado con un 15 % de tinta y trazo más grueso: los pasteles claros (amarillo, verde) apenas se veían sobre el papel
        stroke: 'none', fill: `color-mix(in srgb, ${color} 85%, var(--ink))`, fillStyle: 'hachure', hachureGap: 5, fillWeight: 3, hachureAngle: -50, roughness: 1.2, seed: s + 3,
      })
      : null),
    [w, fillW, color, s],
  )
  return (
    <div ref={ref} className="sketch-bar" style={{ height: h }}>
      <svg width={w} height={h} aria-hidden="true">
        {bar && <Paths drawable={bar} />}
        {frame && <Paths drawable={frame} />}
      </svg>
    </div>
  )
}

// Círculo dibujado (botón de emoción)
export function SketchCircle({ size, seed }: { size: number; seed: string }) {
  const d = useMemo(() => gen.circle(size / 2, size / 2, size - 6, { ...INK, seed: seedOf(seed) }), [size, seed])
  return (
    <svg className="sketch-svg" width={size} height={size} aria-hidden="true">
      <Paths drawable={d} />
    </svg>
  )
}

// Flecha dibujada: Excalifont no trae ↑ ni ↓. Toma el color del texto que la rodea
export function SketchArrow({ dir, size = 11, seed }: { dir: 'up' | 'down'; size?: number; seed: string }) {
  const d = useMemo(() => {
    const mid = size / 2
    const tip = dir === 'up' ? 1 : size - 1
    const tail = dir === 'up' ? size - 1 : 1
    const wing = tip + (dir === 'up' ? 1 : -1) * size * 0.4
    return gen.path(`M${mid} ${tail} L${mid} ${tip} M${mid - size * 0.34} ${wing} L${mid} ${tip} L${mid + size * 0.34} ${wing}`, {
      stroke: 'currentColor', strokeWidth: 1.4, roughness: 0.5, bowing: 0.3, seed: seedOf(seed),
    })
  }, [dir, size, seed])
  return (
    <svg className="sketch-arrow" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" overflow="visible">
      <Paths drawable={d} />
    </svg>
  )
}

// Cinta marcapáginas de tela
export function Ribbon({ length }: { length: number }) {
  const w = 22
  const d = useMemo(
    () => gen.path(`M0 0 H${w} V${length} L${w / 2} ${length - 9} L0 ${length} Z`, {
      stroke: 'var(--ribbon-edge)', strokeWidth: 1.2, fill: 'var(--ribbon)', fillStyle: 'solid', roughness: 0.8, seed: 7,
    }),
    [length],
  )
  return (
    <svg width={w + 2} height={length + 2} viewBox={`-1 -1 ${w + 2} ${length + 2}`} aria-hidden="true">
      <Paths drawable={d} />
      <line x1={w / 2} y1={2} x2={w / 2} y2={length - 14} stroke="var(--ribbon-edge)" strokeDasharray="3 4" strokeWidth="1" />
    </svg>
  )
}
