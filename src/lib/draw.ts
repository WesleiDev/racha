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

/** quantos arranjos diferentes tentar antes de escolher */
const CANDIDATES = 150
/**
 * Aceita arranjos até meia estrela pior que o melhor equilíbrio encontrado.
 * Medido em 300 sorteios: com 0.5 o desequilíbrio médio fica em 0★ (pior caso
 * 0,75★) e ainda sobram ~50 arranjos distintos pra "sortear de novo".
 */
const TOLERANCE = 0.5

/** identidade do arranjo: quem está com quem, independente de nome/cor do time */
export function teamsSignature(teams: string[][]): string {
  return teams
    .map((t) => [...t].sort().join(','))
    .sort()
    .join('|')
}

function buildCandidate(
  loose: Player[],
  seed: string[][],
  numTeams: number,
  playersPerTeam: number,
  looseSlots: number,
  starOf: (id: string) => number,
): DrawResult {
  // quem fica no banco muda a cada tentativa (sobra é rotativa, não castigo fixo)
  const shuffled = shuffle(loose)
  const pool = shuffled.slice(0, looseSlots)
  const bench = shuffled.slice(looseSlots).map((p) => p.id)

  const teams = seed.map((t) => [...t])
  const sum = (t: string[]) => t.reduce((s, id) => s + starOf(id), 0)

  // mais forte primeiro; empates saem em ordem aleatória (pool já embaralhado)
  const ordered = [...pool].sort((a, b) => b.stars - a.stars)

  for (const p of ordered) {
    const open: number[] = []
    for (let t = 0; t < numTeams; t++) if (teams[t].length < playersPerTeam) open.push(t)
    if (open.length === 0) {
      bench.push(p.id)
      continue
    }
    // completa primeiro os times com menos gente
    const minLen = Math.min(...open.map((t) => teams[t].length))
    const candidates = open.filter((t) => teams[t].length === minLen).sort((a, b) => sum(teams[a]) - sum(teams[b]))
    // em geral o time mais fraco leva o jogador; de vez em quando o segundo,
    // e é isso que faz dois sorteios seguidos saírem diferentes
    const pick = candidates.length > 1 && Math.random() < 0.35 ? candidates[1] : candidates[0]
    teams[pick].push(p.id)
  }

  return { teams, bench }
}

/**
 * Sorteia times equilibrados pelas estrelas.
 *
 * Gera vários arranjos aleatórios, mantém os mais equilibrados (dentro de
 * TOLERANCE) e escolhe um ao acaso entre os distintos — assim "sortear de novo"
 * realmente muda os times sem estragar o equilíbrio.
 *
 * `pinned[t]` fixa jogadores no time t. `avoid` é a assinatura do arranjo atual,
 * evitada quando houver alternativa igualmente boa.
 */
export function drawTeams(
  players: Player[],
  numTeams: number,
  playersPerTeam: number,
  pinned: string[][] = [],
  avoid?: string,
): DrawResult {
  const byId = new Map(players.map((p) => [p.id, p]))
  const starOf = (id: string) => byId.get(id)?.stars ?? 0
  const pinnedFlat = new Set(pinned.flat().filter((id) => byId.has(id)))
  const capacity = numTeams * playersPerTeam

  const seed: string[][] = Array.from({ length: numTeams }, (_, t) =>
    (pinned[t] ?? []).filter((id) => byId.has(id)).slice(0, playersPerTeam),
  )

  const loose = players.filter((p) => !pinnedFlat.has(p.id))
  const pinnedCount = seed.reduce((n, t) => n + t.length, 0)
  const looseSlots = Math.max(0, capacity - pinnedCount)

  const tries: { result: DrawResult; spread: number; sig: string }[] = []
  for (let i = 0; i < CANDIDATES; i++) {
    const result = buildCandidate(loose, seed, numTeams, playersPerTeam, looseSlots, starOf)
    const sums = result.teams.map((t) => t.reduce((s, id) => s + starOf(id), 0))
    tries.push({
      result,
      spread: Math.max(...sums) - Math.min(...sums),
      sig: teamsSignature(result.teams),
    })
  }

  const best = Math.min(...tries.map((t) => t.spread))
  const good = tries.filter((t) => t.spread <= best + TOLERANCE)

  // um arranjo por assinatura, pra sortear com peso igual entre opções de verdade
  const distinct = new Map<string, DrawResult>()
  for (const t of good) if (!distinct.has(t.sig)) distinct.set(t.sig, t.result)

  const options = [...distinct.entries()]
  const fresh = avoid ? options.filter(([sig]) => sig !== avoid) : options
  const pickFrom = fresh.length > 0 ? fresh : options

  return pickFrom[Math.floor(Math.random() * pickFrom.length)][1]
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
