import { initials } from '../lib/colors'
import { fmtStars } from '../lib/format'

export function Avatar({
  name,
  color,
  size = 38,
  dim,
}: {
  name: string
  color: string
  size?: number
  dim?: boolean
}) {
  return (
    <span
      style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
      className={`rounded-full flex-none flex items-center justify-center font-bold text-white select-none ${dim ? 'opacity-40' : ''}`}
    >
      {initials(name)}
    </span>
  )
}

/** estrela com preenchimento parcial (meia estrela via clip de largura) */
function Star({ fill, size = 14 }: { fill: number; size?: number }) {
  const path = 'M12 3l2.47 5.7 6.2.55-4.7 4.07 1.4 6.05L12 16.2l-5.37 3.17 1.4-6.05-4.7-4.07 6.2-.55L12 3z'
  return (
    <span style={{ width: size, height: size }} className="relative inline-block flex-none">
      <svg width={size} height={size} viewBox="0 0 24 24" className="absolute inset-0">
        <path d={path} fill="#E6E4DE" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d={path} fill="#FFB300" />
        </svg>
      </span>
    </span>
  )
}

export function Stars({ value, size = 14, dim }: { value: number; size?: number; dim?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-[2px] ${dim ? 'opacity-40' : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={Math.max(0, Math.min(1, value - (i - 1)))} />
      ))}
    </span>
  )
}

/** seletor 1–5 com meia estrela (toca na mesma estrela pra alternar cheia/meia) */
export function StarPicker({
  value,
  onChange,
  half,
}: {
  value: number
  onChange: (v: number) => void
  half: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const target = half && i >= 2 ? i - 0.5 : i
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(target)}
            className="active:scale-90 transition-transform"
            aria-label={`${target} estrelas`}
          >
            <Star size={34} fill={Math.max(0, Math.min(1, value - (i - 1)))} />
          </button>
        )
      })}
      <span className="num num-118 text-[15px] font-bold text-ink ml-1">{fmtStars(value)}</span>
      <span className="text-[12px] text-ter -ml-1">de 5</span>
    </div>
  )
}
