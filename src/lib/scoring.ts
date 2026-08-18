import type { Match, MatchConfig, MatchEvent } from '../data/types'

export interface BoardState {
  /** placares dos sets fechados, por time */
  closedSets: number[][]
  /** pontos do set atual, por time */
  current: number[]
  setsWon: number[]
  /** nº (1-based) do set em andamento */
  setIndex: number
  isTiebreak: boolean
  /** time que saca (último a pontuar) */
  serve: number
  /** time que acabou de atingir a condição de fechar o set (mostrar modal) */
  pendingSetWin: number | null
  /** partida decidida (após fechar o set final) */
  finished: boolean
  winner: number | null
}

export function setsToWin(config: MatchConfig): number {
  return Math.ceil(config.bestOf / 2)
}

function setTarget(config: MatchConfig, setIndex: number): number {
  if (config.scoring !== 'sets') return config.freeTarget ?? Infinity
  const isTiebreak = setIndex >= config.bestOf
  return isTiebreak ? config.tiebreakPoints : config.setPoints
}

function reachedWin(config: MatchConfig, setIndex: number, scores: number[], team: number): boolean {
  const target = setTarget(config, setIndex)
  if (!isFinite(target)) return false
  const p = scores[team]
  const o = Math.max(...scores.filter((_, i) => i !== team))
  if (config.scoring === 'sets' && config.advantage2) return p >= target && p - o >= 2
  return p >= target && p > o
}

/** Deriva todo o estado do placar a partir da lista de eventos (event sourcing → undo = pop). */
export function computeBoard(config: MatchConfig, events: MatchEvent[], serveStart = 0, numTeams = 2): BoardState {
  const closedSets: number[][] = []
  const setsWon = Array(numTeams).fill(0)
  let current = Array(numTeams).fill(0)
  let serve = serveStart

  for (const ev of events) {
    if (ev.type === 'point') {
      current[ev.team] += 1
      serve = ev.team
    } else if (ev.type === 'set-close') {
      const winner = current.indexOf(Math.max(...current))
      closedSets.push(current)
      setsWon[winner] += 1
      current = Array(numTeams).fill(0)
    }
  }

  const setIndex = closedSets.length + 1
  const isTiebreak = config.scoring === 'sets' && setIndex >= config.bestOf

  const need = setsToWin(config)
  const finishedBySets = config.scoring === 'sets' && setsWon.some((w) => w >= need)

  let pendingSetWin: number | null = null
  if (!finishedBySets) {
    for (let t = 0; t < numTeams; t++) {
      if (reachedWin(config, setIndex, current, t)) {
        pendingSetWin = t
        break
      }
    }
  }

  let finished = finishedBySets
  let winner: number | null = null
  if (config.scoring === 'sets') {
    if (finishedBySets) winner = setsWon.findIndex((w) => w >= need)
  } else if (config.scoring === 'livre' && config.freeTarget) {
    // no modo livre, atingir o alvo encerra a partida (1 "set" único)
    if (closedSets.length > 0) {
      finished = true
      const last = closedSets[closedSets.length - 1]
      winner = last.indexOf(Math.max(...last))
    }
  }

  return { closedSets, current, setsWon, setIndex, isTiebreak, serve, pendingSetWin, finished, winner }
}

/** monta o estado a partir de parciais digitadas (resultado anotado depois do jogo) */
export function boardFromSets(config: MatchConfig, sets: number[][], numTeams = 2): BoardState {
  const setsWon = Array(numTeams).fill(0)
  for (const s of sets) {
    const max = Math.max(...s)
    const winners = s.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0)
    if (winners.length === 1) setsWon[winners[0]] += 1
  }

  const totals = Array.from({ length: numTeams }, (_, t) => sets.reduce((sum, s) => sum + (s[t] ?? 0), 0))
  const decide = (arr: number[]) => {
    const max = Math.max(...arr)
    return arr.filter((v) => v === max).length === 1 ? arr.indexOf(max) : null
  }
  const winner = config.scoring === 'sets' ? decide(setsWon) ?? decide(totals) : decide(totals)

  return {
    closedSets: sets,
    current: Array(numTeams).fill(0),
    setsWon,
    setIndex: sets.length + 1,
    isTiebreak: false,
    serve: 0,
    pendingSetWin: null,
    finished: true,
    winner,
  }
}

/** estado do placar de uma partida, tenha ela sido marcada ao vivo ou anotada depois */
export function boardOf(match: Match): BoardState {
  if (match.manualSets && match.manualSets.length > 0) {
    return boardFromSets(match.config, match.manualSets, match.teams.length)
  }
  return computeBoard(match.config, match.events, match.serveStart, match.teams.length)
}

/** vencedor "no estado atual" (para encerrar manualmente): mais sets; empate → pontos totais */
export function leaderNow(state: BoardState): number | null {
  const { setsWon, current, closedSets } = state
  const maxSets = Math.max(...setsWon)
  const bySets = setsWon.filter((w) => w === maxSets).length === 1 ? setsWon.indexOf(maxSets) : null
  if (bySets !== null) return bySets
  const totals = current.map((c, t) => c + closedSets.reduce((s, set) => s + set[t], 0))
  const max = Math.max(...totals)
  if (totals.filter((x) => x === max).length === 1) return totals.indexOf(max)
  return null
}

/** placar “por sets” pro histórico: sets fechados + set atual se tiver pontos */
export function allSets(state: BoardState): number[][] {
  const sets = [...state.closedSets]
  if (state.current.some((p) => p > 0)) sets.push(state.current)
  return sets
}
