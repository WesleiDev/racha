import { useNavigate } from 'react-router-dom'

type Tab = 'grupo' | 'jogadores' | 'historico' | 'ranking'

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const color = active ? '#7C4DFF' : '#9A97A5'
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (tab) {
    case 'grupo':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M4 12h16M12 4v16" opacity={active ? 1 : 0.7} />
        </svg>
      )
    case 'jogadores':
      return (
        <svg {...common}>
          <circle cx="9" cy="8.5" r="3.5" />
          <path d="M3.5 19.5c.5-3.5 2.8-5 5.5-5s5 1.5 5.5 5M15.5 5.5a3.5 3.5 0 0 1 0 6M17 14.8c2 .5 3.2 2 3.5 4.7" />
        </svg>
      )
    case 'historico':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    case 'ranking':
      return (
        <svg {...common}>
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
          <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 14v3M8.5 20.5h7" />
        </svg>
      )
  }
}

const TABS: { id: Tab; label: string; path: (gid: string) => string }[] = [
  { id: 'grupo', label: 'Grupo', path: (g) => `/g/${g}` },
  { id: 'jogadores', label: 'Jogadores', path: (g) => `/g/${g}/jogadores` },
  { id: 'historico', label: 'Histórico', path: (g) => `/g/${g}/historico` },
  { id: 'ranking', label: 'Ranking', path: (g) => `/g/${g}/ranking` },
]

export function TabBar({ groupId, active }: { groupId: string; active: Tab }) {
  const nav = useNavigate()
  return (
    <>
      <div className="h-[86px]" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] bg-white/92 backdrop-blur-[10px] border-t border-cardline flex px-2.5 pt-2 pb-[max(22px,env(safe-area-inset-bottom))] z-40">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => nav(t.path(groupId))}
            className="flex-1 flex flex-col items-center gap-1 py-0.5"
          >
            <TabIcon tab={t.id} active={active === t.id} />
            <span className={`text-[10.5px] font-semibold ${active === t.id ? 'text-accent' : 'text-dis'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
