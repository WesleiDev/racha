import type { Player } from '../data/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface DrawResult {
  teams: string[][]
  bench: string[]
}

/**
 * Sorteio equilibrado por estrelas: snake draft com desempate aleatório.
 * `pinned[t]` são jogadores travados no time t (mantidos no re-sorteio).
 */
export function drawTeams(
  players: Player[],
  numTeams: number,
  playersPerTeam: number,
  pinned: string[][] = [],
): DrawResult {
  const byId = new Map(players.map((p) => [p.id, p]))
  const pinnedFlat = new Set(pinned.flat().filter((id) => byId.has(id)))
  const capacity = numTeams * playersPerTeam

  const teams: string[][] = Array.from({ length: numTeams }, (_, t) =>
    (pinned[t] ?? []).filter((id) => byId.has(id)),
  )

  const loose = players.filter((p) => !pinnedFlat.has(p.id))
  const pinnedCount = teams.reduce((n, t) => n + t.length, 0)
  const looseSlots = Math.max(0, capacity - pinnedCount)

  // sobra vai pro banco (aleatória entre os não fixados)
  const shuffled = shuffle(loose)
  const pool = shuffled.slice(0, looseSlots)
  const bench = shuffled.slice(looseSlots).map((p) => p.id)

  // mais forte primeiro, com desempate aleatório (já embaralhado acima → sort estável)
  pool.sort((a, b) => b.stars - a.stars)

  const starSum = (t: string[]) => t.reduce((s, id) => s + (byId.get(id)?.stars ?? 0), 0)

  // snake: cada jogador vai pro time não-cheio com menos gente; empate → menor soma de estrelas
  for (const p of pool) {
    let best = -1
    for (let t = 0; t < numTeams; t++) {
      if (teams[t].length >= playersPerTeam) continue
      if (
        best === -1 ||
        teams[t].length < teams[best].length ||
        (teams[t].length === teams[best].length && starSum(teams[t]) < starSum(teams[best]))
      ) {
        best = t
      }
    }
    if (best === -1) {
      // todos os times cheios (fixados demais) → banco
      bench.push(p.id)
      continue
    }
    teams[best].push(p.id)
  }

  return { teams, bench }
}

export function teamStars(playerIds: string[], players: Player[]): number {
  const byId = new Map(players.map((p) => [p.id, p]))
  return playerIds.reduce((s, id) => s + (byId.get(id)?.stars ?? 0), 0)
}

export type BalanceLevel = 'otimo' | 'bom' | 'ruim'

export function balance(teams: string[][], players: Player[]): { level: BalanceLevel; sums: number[] } {
  const sums = teams.map((t) => teamStars(t, players))
  const diff = Math.max(...sums) - Math.min(...sums)
  const level: BalanceLevel = diff <= 1 ? 'otimo' : diff <= 2.5 ? 'bom' : 'ruim'
  return { level, sums }
}
