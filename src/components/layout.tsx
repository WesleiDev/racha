import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBack } from './icons'

/** coluna do app; `dark` pinta o fundo da página inteira (login, resumo, card) */
export function Screen({ children, dark, board }: { children?: ReactNode; dark?: boolean; board?: boolean }) {
  useEffect(() => {
    const bg = board ? '#0B0A0F' : dark ? '#15141A' : '#E8E6E0'
    document.body.style.background = bg
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', board ? '#0B0A0F' : dark ? '#15141A' : '#F7F6F3')
    return () => {
      document.body.style.background = '#E8E6E0'
    }
  }, [dark, board])

  return (
    <div className={`app-col flex flex-col ${dark ? 'bg-dark' : 'bg-paper'}`}>
      {children}
    </div>
  )
}

export function Header({
  title,
  sub,
  back,
  right,
  big,
}: {
  title: ReactNode
  sub?: ReactNode
  back?: boolean | string
  right?: ReactNode
  big?: boolean
}) {
  const nav = useNavigate()
  return (
    <div className="px-5 pt-[max(14px,env(safe-area-inset-top))] pb-2 flex items-start gap-3">
      {back && (
        <button
          onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          className="w-[34px] h-[34px] -ml-1.5 mt-0.5 rounded-full flex items-center justify-center text-ink active:bg-field flex-none"
          aria-label="Voltar"
        >
          <IconBack size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className={`font-extrabold text-ink leading-tight ${big ? 'text-[28px] tracking-[-0.035em]' : 'text-[22px] tracking-[-0.03em]'}`}>
          {title}
        </h1>
        {sub && <div className="text-[13px] text-ter mt-0.5">{sub}</div>}
      </div>
      {right && <div className="flex-none mt-0.5">{right}</div>}
    </div>
  )
}

/**
 * Rodapé fixo com CTA. O espaçador acompanha a altura real da barra —
 * com altura fixa, uma barra de dois botões escondia o fim do conteúdo.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(110)

  useEffect(() => {
    const el = bar.current
    if (!el) return
    const update = () => setHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div style={{ height: height + 12 }} />
      <div
        ref={bar}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] bg-paper/95 backdrop-blur-[10px] border-t border-cardline px-5 pt-3 pb-[max(26px,env(safe-area-inset-bottom))] z-40"
      >
        {children}
      </div>
    </>
  )
}

export function Content({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 flex-1 ${className}`}>{children}</div>
}
