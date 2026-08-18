import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

type Variant = 'purple' | 'black' | 'lime' | 'white' | 'outline' | 'glass' | 'danger-glass'

const VARIANTS: Record<Variant, string> = {
  purple: 'bg-accent text-white active:bg-accent-press',
  black: 'bg-ink text-white active:opacity-85',
  lime: 'bg-lime text-ink active:opacity-85',
  white: 'bg-white text-ink active:bg-[#EDEBF5]',
  outline: 'bg-transparent text-ink border border-strong active:bg-field',
  glass: 'bg-white/10 text-white active:bg-white/20',
  'danger-glass': 'bg-danger/16 text-danger-soft active:bg-danger/25',
}

export function Button({
  variant = 'purple',
  size = 'lg',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'lg' | 'md' | 'sm' }) {
  const h = size === 'lg' ? 'h-[54px] text-[16px]' : size === 'md' ? 'h-12 text-[15px]' : 'h-10 text-[14px]'
  return (
    <button
      {...rest}
      className={`${VARIANTS[variant]} ${h} w-full rounded-[15px] font-bold tracking-[-0.01em] transition-colors disabled:opacity-40 flex items-center justify-center gap-2 select-none ${className}`}
    >
      {children}
    </button>
  )
}

export function IconCircleButton({
  children,
  size = 34,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number }) {
  return (
    <button
      {...rest}
      style={{ width: size, height: size }}
      className={`rounded-full border border-strong text-ink flex items-center justify-center active:bg-field transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Textos e blocos                                                     */
/* ------------------------------------------------------------------ */

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[11.5px] font-bold uppercase tracking-[0.08em] text-ter ${className}`}>{children}</div>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-cardline rounded-[20px] ${onClick ? 'cursor-pointer active:border-accent-line' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/** aviso roxo suave ("as estrelas só aparecem pra organizadores") */
export function Notice({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-accent-soft text-accent-press rounded-[14px] px-3.5 py-3 text-[12.5px] font-medium leading-snug flex items-start gap-2.5">
      {icon && <span className="mt-[1px]">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

export function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-14 px-8">
      <div className="text-[44px] leading-none">{emoji}</div>
      <div className="text-[17px] font-bold text-ink mt-2">{title}</div>
      <div className="text-[13.5px] text-ter leading-relaxed max-w-[260px]">{sub}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`w-[46px] h-[28px] rounded-full p-[3px] transition-colors flex-none disabled:opacity-40 ${on ? 'bg-accent' : 'bg-knob2'}`}
      aria-pressed={on}
    >
      <span
        className={`block w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-[18px]' : ''}`}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="bg-field rounded-[13px] p-1 flex gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 h-9 rounded-[10px] text-[13.5px] font-semibold transition-colors ${
            value === o.id ? 'bg-white text-ink shadow-[0_1px_3px_rgba(20,18,30,0.10)]' : 'text-ter'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const btn =
    'w-[26px] h-[26px] rounded-full border border-strong text-ink flex items-center justify-center text-[15px] font-bold active:bg-field disabled:opacity-30'
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="num num-112 text-[22px] font-extrabold text-ink w-7 text-center">{value}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="bg-field rounded-[12px] h-[42px] flex items-center gap-2.5 px-3.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A97A5" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 text-[14.5px] text-ink placeholder:text-dis"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sheet e modal                                                       */
/* ------------------------------------------------------------------ */

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/45 fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[448px] bg-paper rounded-t-[24px] sheet-up pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="w-10 h-1 rounded-full bg-strong mx-auto mt-2.5 mb-1" />
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** modal de confirmação (usado sobre o placar escuro e telas claras) */
export function Modal({
  open,
  dark,
  children,
}: {
  open: boolean
  dark?: boolean
  children: ReactNode
}) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className={`absolute inset-0 fade-in ${dark ? 'bg-black/60' : 'bg-ink/45'}`} />
      <div
        className={`relative w-full max-w-[360px] rounded-[22px] p-6 pop-in ${
          dark ? 'bg-dark-elev text-white border border-white/10' : 'bg-white text-ink'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Diversos                                                            */
/* ------------------------------------------------------------------ */

export function Dot({ color, size = 9 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, background: color }} className="rounded-full inline-block flex-none" />
}

export function LiveDot({ color = '#FFC93C' }: { color?: string }) {
  return <span style={{ background: color }} className="w-2 h-2 rounded-full inline-block animate-racha-pulse" />
}

/** foco automático com teclado */
export function AutoFocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])
  return <input ref={ref} {...props} />
}
