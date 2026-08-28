import type { Match, Team } from '../data/types'
import { Dot } from './ui'
import { teamColor } from '../lib/colors'
import { matchWinner } from '../lib/rank'

const short = (name: string) => name.replace(/^Time /, '')
const pairKey = (a?: string, b?: string) => [a ?? '', b ?? ''].sort().join('|')

export interface Matchup {
  i: number
  j: number
  a: Team
  b: Team
}

/**
 * Todos os confrontos possíveis entre os times sorteados.
 * Time incompleto entra na lista igual aos outros — só fica de fora quem
 * acabou sem ninguém (acontece quando tem menos gente que times).
 */
export function matchups(teams: Team[]): Matchup[] {
  return teams
    .flatMap((a, i) => teams.slice(i + 1).map((b, k) => ({ i, j: i + 1 + k, a, b })))
    .filter((p) => p.a.playerIds.length > 0 && p.b.playerIds.length > 0)
}

/** índices dos times que dá pra escalar (os que têm gente) */
export function playableTeams(teams: Team[]): number[] {
  return teams.map((_, i) => i).filter((i) => teams[i].playerIds.length > 0)
}

function lastFinished(games: Match[]): Match | null {
  const finished = games
    .filter((g) => g.status === 'finished')
    .sort((a, b) => (a.finishedAt ?? a.startedAt) - (b.finishedAt ?? b.startedAt))
  return finished[finished.length - 1] ?? null
}

/**
 * Quem ganha fica: o vencedor do último jogo contra quem estava esperando.
 * Devolve null quando ainda não rolou jogo (ou ninguém ficou de fora).
 */
export function suggestedMatchup(teams: Team[], games: Match[]): [number, number] | null {
  const last = lastFinished(games)
  if (!last) return null
  const w = matchWinner(last)
  if (w === null) return null
  const winner = teams.findIndex((t) => t.name === last.teams[w]?.name)
  if (winner === -1) return null

  const played = new Set(last.teams.map((t) => t.name))
  const gamesOf = (name: string) => games.filter((g) => g.teams.some((t) => t.name === name)).length
  // quem esperou entra; com 4 times, entra quem jogou menos
  const waiting = playableTeams(teams)
    .filter((i) => !played.has(teams[i].name))
    .sort((a, b) => gamesOf(teams[a].name) - gamesOf(teams[b].name))

  return waiting.length > 0 ? [winner, waiting[0]] : null
}

/**
 * Escolha do confronto desta quadra. O sugerido (quem ganha fica) vem primeiro.
 */
export function MatchupPicker({
  teams,
  games = [],
  onPick,
}: {
  teams: Team[]
  games?: Match[]
  onPick: (i: number, j: number) => void
}) {
  const suggested = suggestedMatchup(teams, games)
  const isSuggested = (p: Matchup) =>
    suggested !== null && (p.i === suggested[0] || p.j === suggested[0]) && (p.i === suggested[1] || p.j === suggested[1])

  const pairs = matchups(teams)
  const ordered = suggested === null ? pairs : [...pairs].sort((x, y) => Number(isSuggested(y)) - Number(isSuggested(x)))
  const winnerName = suggested === null ? null : short(teams[suggested[0]].name)

  return (
    <div className="px-5 pt-3 pb-2">
      <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Quem entra em quadra?</div>
      <div className="text-[13px] text-ter mt-0.5 mb-4">
        {winnerName
          ? `${winnerName} venceu o último — quem ganha fica.`
          : 'Escolhe o confronto. Os outros esperam a vez.'}
      </div>
      <div className="flex flex-col gap-2">
        {ordered.map((p) => {
          const key = pairKey(p.a.name, p.b.name)
          const emQuadra = games.some(
            (g) => g.status === 'live' && pairKey(g.teams[0]?.name, g.teams[1]?.name) === key,
          )
          const jaJogou =
            !emQuadra && games.some((g) => g.teams.length === 2 && pairKey(g.teams[0].name, g.teams[1].name) === key)
          return (
            <button
              key={`${p.i}-${p.j}`}
              onClick={() => onPick(p.i, p.j)}
              className={`flex items-center gap-2 rounded-[14px] border bg-card px-4 py-3 text-left active:border-accent ${
                isSuggested(p) ? 'border-accent-line' : 'border-cardline'
              }`}
            >
              <span className="flex-1 flex items-center gap-2 min-w-0">
                <Dot color={teamColor(p.a.colorId).hex} size={12} />
                <span className="text-[15px] font-bold text-ink truncate">{short(p.a.name)}</span>
                <span className="num num-112 text-[11.5px] font-semibold text-ter">{p.a.playerIds.length}</span>
                <span className="text-dis text-[13px]">×</span>
                <span className="text-[15px] font-bold text-ink truncate">{short(p.b.name)}</span>
                <span className="num num-112 text-[11.5px] font-semibold text-ter">{p.b.playerIds.length}</span>
                <Dot color={teamColor(p.b.colorId).hex} size={12} />
              </span>
              {emQuadra ? (
                <span className="text-[10.5px] font-extrabold text-danger bg-danger/10 rounded-full px-2 py-1 flex-none">
                  NA QUADRA
                </span>
              ) : isSuggested(p) ? (
                <span className="text-[10.5px] font-bold text-accent bg-accent-soft rounded-full px-2 py-1 flex-none">
                  quem ganha fica
                </span>
              ) : jaJogou ? (
                <span className="text-[10.5px] font-bold text-ter bg-field rounded-full px-2 py-1 flex-none">
                  já jogou
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
