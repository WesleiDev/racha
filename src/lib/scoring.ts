import type { Match, MatchConfig, MatchEvent } from '../data/types'

export interface BoardState {
  /** sets fechados. Tênis: games por set (ex.: [6,4]); demais: pontos */
  closedSets: number[][]
  /** set atual. Tênis: games do set; demais: pontos */
  current: number[]
  setsWon: number[]
  /** nº (1-based) do set em andamento */
  setIndex: number
  isTiebreak: boolean
  /** time que saca (último a pontuar; no tênis, alterna a cada game) */
  serve: number
  /** time que acabou de atingir a condição de fechar o set (mostrar modal) */
  pendingSetWin: number | null
  /** partida decidida (após fechar o set final) */
  finished: boolean
  winner: number | null
  /** tênis: pontos crus do game atual */
  points?: number[]
  /** tênis: como mostrar o ponto — 0/15/30/40/AD, ou número cru no tiebreak */
  pointLabels?: string[]
  /** tênis: o set decisivo está sendo jogado como super tiebreak */
  superTiebreak?: boolean
}

/** modos em que a partida é dividida em sets (placar mostra sets ganhos) */
export function usesSets(config: MatchConfig): boolean {
  return config.scoring === 'sets' || config.scoring === 'tenis'
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

const POINT_LABELS = ['0', '15', '30', '40']

/** rótulo do ponto no game: 0/15/30/40, deuce e vantagem */
function gameLabels(points: number[], noAd: boolean): string[] {
  const [a, b] = points
  if (a >= 3 && b >= 3) {
    if (noAd || a === b) return ['40', '40']
    return a > b ? ['AD', '40'] : ['40', 'AD']
  }
  return [POINT_LABELS[Math.min(a, 3)], POINT_LABELS[Math.min(b, 3)]]
}

/**
 * Pontuação de tênis/padel/beach tennis: ponto → game → set.
 *
 * Diferente do vôlei, o set fecha sozinho pela regra (6 games com 2 de
 * diferença, ou tiebreak em 6-6) — não existe "fechar set" manual. Como tudo
 * é derivado dos eventos, desfazer continua sendo só remover o último ponto.
 */
function computeTennis(config: MatchConfig, events: MatchEvent[], serveStart: number): BoardState {
  const need = setsToWin(config)
  const perSet = config.gamesPerSet ?? 6
  const tbPoints = config.tiebreakPoints || 7
  const stbPoints = config.superTiebreakPoints ?? 10
  const noAd = Boolean(config.noAd)

  const closedSets: number[][] = []
  const setsWon = [0, 0]
  let games = [0, 0]
  let points = [0, 0]
  let finished = false
  let winner: number | null = null
  let gamesEver = 0

  /** o set decisivo é jogado como super tiebreak? */
  const isDecider = () =>
    Boolean(config.superTiebreakFinal) && setsWon[0] === need - 1 && setsWon[1] === need - 1

  const closeSet = (t: number, score: number[]) => {
    closedSets.push(score)
    setsWon[t] += 1
    games = [0, 0]
    points = [0, 0]
    if (setsWon[t] >= need) {
      finished = true
      winner = t
    }
  }

  for (const ev of events) {
    if (finished || ev.type !== 'point') continue
    const t = ev.team
    const o = 1 - t
    const decider = isDecider()
    const inTb = decider || (games[0] >= perSet && games[1] >= perSet)

    points[t] += 1

    if (inTb) {
      const target = decider ? stbPoints : tbPoints
      if (points[t] >= target && points[t] - points[o] >= 2) {
        if (decider) {
          // super tiebreak: o set é registrado pelos pontos (ex.: 10-8)
          closeSet(t, [points[0], points[1]])
        } else {
          games[t] += 1
          gamesEver += 1
          closeSet(t, [games[0], games[1]])
        }
      }
      continue
    }

    const gameWon = noAd ? points[t] >= 4 : points[t] >= 4 && points[t] - points[o] >= 2
    if (!gameWon) continue

    games[t] += 1
    gamesEver += 1
    points = [0, 0]
    if (games[t] >= perSet && games[t] - games[o] >= 2) closeSet(t, [games[0], games[1]])
  }

  const decider = isDecider()
  const inTb = decider || (games[0] >= perSet && games[1] >= perSet)

  return {
    closedSets,
    current: decider ? [0, 0] : games,
    setsWon,
    setIndex: closedSets.length + 1,
    isTiebreak: inTb,
    // no tênis o saque troca a cada game
    serve: (serveStart + gamesEver) % 2,
    pendingSetWin: null,
    finished,
    winner,
    points,
    pointLabels: inTb ? points.map(String) : gameLabels(points, noAd),
    superTiebreak: decider,
  }
}

/** Deriva todo o estado do placar a partir da lista de eventos (event sourcing → undo = pop). */
export function computeBoard(config: MatchConfig, events: MatchEvent[], serveStart = 0, numTeams = 2): BoardState {
  if (config.scoring === 'tenis') return computeTennis(config, events, serveStart)
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
  const winner = usesSets(config) ? decide(setsWon) ?? decide(totals) : decide(totals)

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
    // aceita também o formato antigo ([25,18]) de dados salvos antes da correção
    const sets = match.manualSets.map((s) => (Array.isArray(s) ? (s as number[]) : [s.a, s.b]))
    return boardFromSets(match.config, sets, match.teams.length)
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
