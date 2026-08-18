import type { ReactNode } from 'react'
import type { Match } from '../data/types'
import type { BoardState } from '../lib/scoring'
import { teamColor, hexToRgb } from '../lib/colors'

/**
 * Metades do placar (compartilhado entre o placar e o modo espectador).
 * `pulseKey` retrigga a animação de escala no número do time que pontuou.
 */
export function BoardHalves({
  match,
  board,
  onTap,
  pulse,
  children,
}: {
  match: Match
  board: BoardState
  onTap?: (team: number) => void
  pulse?: { team: number; key: number } | null
  children?: ReactNode
}) {
  const order = match.flip ? [1, 0] : [0, 1]
  const showSets = match.config.scoring === 'sets'

  return (
    <div className="absolute inset-0 flex select-none">
      {order.map((t, pos) => {
        const team = match.teams[t]
        const c = teamColor(team.colorId)
        const rgb = hexToRgb(c.hex)
        const serving = showSets && board.serve === t && !board.finished
        return (
          <button
            key={t}
            onClick={onTap ? () => onTap(t) : undefined}
            disabled={!onTap}
            className="relative flex-1 flex flex-col items-center justify-center gap-2 overflow-hidden touch-manipulation"
            style={{
              background: `linear-gradient(180deg, rgba(${rgb},0.30) 0%, rgba(${rgb},0.06) 100%)`,
              borderLeft: pos === 1 ? '1px solid rgba(255,255,255,0.10)' : undefined,
              WebkitUserSelect: 'none',
            }}
          >
            <span className="flex items-center gap-2.5">
              <span style={{ width: 9, height: 9, background: c.hex }} className="rounded-full inline-block" />
              <span className="text-white text-[17px] font-bold uppercase tracking-[0.02em]">
                {team.name.replace(/^Time /, '')}
              </span>
              {serving && (
                <span className="bg-lime text-ink text-[9.5px] font-extrabold tracking-[0.12em] rounded-full px-2 py-[3px]">
                  SAQUE
                </span>
              )}
            </span>
            <span
              key={pulse?.team === t ? pulse.key : 'static'}
              className={`num num-125 text-white font-black ${pulse?.team === t ? 'tap-pulse' : ''}`}
              style={{ fontSize: 'min(26vw, 38vh)', lineHeight: 0.82, letterSpacing: '-0.04em' }}
            >
              {board.current[t]}
            </span>
            {showSets && (
              <span className="flex gap-2 mt-1">
                {Array.from({ length: match.config.bestOf }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      background: i < board.setsWon[t] ? c.hex : 'rgba(255,255,255,0.18)',
                    }}
                    className="rounded-full inline-block"
                  />
                ))}
              </span>
            )}
          </button>
        )
      })}
      {children}
    </div>
  )
}

/** pill central do topo: nº do set + parciais */
export function SetPill({ match, board }: { match: Match; board: BoardState }) {
  if (match.config.scoring !== 'sets') return null
  return (
    <div className="flex items-center gap-2.5 bg-white/7 rounded-full px-3.5 py-1.5">
      <span className="text-white text-[11px] font-extrabold tracking-[0.1em]">
        {board.setIndex}º SET{board.isTiebreak ? ' · TIEBREAK' : ''}
      </span>
      {board.closedSets.length > 0 && (
        <span className="num num-118 text-ondark-ter text-[11.5px] font-bold">
          {board.closedSets.map((s) => `${s[0]}-${s[1]}`).join(' · ')}
        </span>
      )}
    </div>
  )
}
