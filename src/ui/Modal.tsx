import { useEffect, useRef, type ReactNode } from 'react'
import { SketchBox } from './sketch'

interface ModalProps {
  title: string
  onClose(): void
  children: ReactNode
}

// Hoja emergente dibujada a mano; se cierra con Escape o tocando fuera
export function Modal({ title, onClose, children }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={panel} className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <SketchBox seed={`modal-${title}`} className="modal-box" fill="var(--paper)" fillStyle="solid">
          <h2 className="modal-title">{title}</h2>
          {children}
        </SketchBox>
      </div>
    </div>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?(): void
  seed: string
  variant?: 'primary' | 'plain'
  disabled?: boolean
  type?: 'button' | 'submit'
  ariaLabel?: string
  className?: string
}

export function SketchButton({ children, onClick, seed, variant = 'plain', disabled, type = 'button', ariaLabel, className }: ButtonProps) {
  return (
    <button type={type} className={`sketch-button ${variant} ${className ?? ''}`} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      <SketchBox seed={seed} radius={10} fill={variant === 'primary' ? 'var(--highlight)' : undefined}>
        <span className="sketch-button-label">{children}</span>
      </SketchBox>
    </button>
  )
}
