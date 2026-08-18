import type { Match } from '../data/types'
import { computeBoard, allSets } from './scoring'

export interface RankRow {
  playerId: string
  name: string
  color: string
  games: number
  wins: number
  pct: number
  /** vitórias seguidas atuais (0 se perdeu a última) */
  streak: number
}

export interface Highlights {
  topStreak: RankRow | null
  /** maior lavada: diferença de pontos num set */
  blowout: { diff: number; score: string } | null
}

export function matchWinner(m: Match): number | null {
  const board = computeBoard(m.config, m.events, m.serveStart, m.teams.length)
  if (board.winner !== null) return board.winner
  // encerrada manualmente: mais sets; empate → mais pontos
  const sets = allSets(board)
  const totals = m.teams.map((_, t) => sets.reduce((s, set) => s + (set[t] ?? 0), 0))
  const bySets = board.setsWon
  const maxSets = Math.max(...bySets)
  if (bySets.filter((x) => x === maxSets).length === 1) return bySets.indexOf(maxSets)
  const maxPts = Math.max(...totals)
  if (totals.filter((x) => x === maxPts).length === 1) return totals.indexOf(maxPts)
  return null
}

export function computeRanking(matches: Match[]): RankRow[] {
  const rows = new Map<string, RankRow>()
  // do mais antigo pro mais novo pra calcular sequência
  const finished = matches.filter((m) => m.status === 'finished').sort((a, b) => a.startedAt - b.startedAt)

  for (const m of finished) {
    const winner = matchWinner(m)
    m.teams.forEach((team, t) => {
      for (const pid of team.playerIds) {
        const snap = m.players[pid] ?? { name: '?', color: '#9A97A5' }
        const row = rows.get(pid) ?? {
          playerId: pid,
          name: snap.name,
          color: snap.color,
          games: 0,
          wins: 0,
          pct: 0,
          streak: 0,
        }
        row.games += 1
        row.name = snap.name
        row.color = snap.color
        if (winner === t) {
          row.wins += 1
          row.streak += 1
        } else if (winner !== null) {
          row.streak = 0
        }
        rows.set(pid, row)
      }
    })
  }

  const out = [...rows.values()]
  for (const r of out) r.pct = r.games > 0 ? Math.round((r.wins / r.games) * 100) : 0
  out.sort((a, b) => b.pct - a.pct || b.wins - a.wins || b.games - a.games)
  return out
}

export function computeHighlights(matches: Match[], ranking: RankRow[]): Highlights {
  const topStreak = ranking.filter((r) => r.streak >= 2).sort((a, b) => b.streak - a.streak)[0] ?? null

  let blowout: Highlights['blowout'] = null
  for (const m of matches.filter((x) => x.status === 'finished')) {
    const board = computeBoard(m.config, m.events, m.serveStart, m.teams.length)
    for (const set of allSets(board)) {
      const sorted = [...set].sort((a, b) => b - a)
      const diff = sorted[0] - sorted[1]
      if (sorted[0] > 0 && (!blowout || diff > blowout.diff)) {
        blowout = { diff, score: `${sorted[0]}×${sorted[1]}` }
      }
    }
  }
  return { topStreak, blowout }
}
