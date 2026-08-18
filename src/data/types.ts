export type Sport = 'volei' | 'futsal' | 'basquete' | 'beach' | 'outro'
export type ScoringMode = 'sets' | 'tempo' | 'livre'

export interface UserProfile {
  id: string
  name: string
  email?: string
  photoUrl?: string
}

export interface MatchConfig {
  sport: Sport
  numTeams: number
  playersPerTeam: number
  scoring: ScoringMode
  /** modo sets */
  setPoints: number
  advantage2: boolean
  bestOf: number
  tiebreakPoints: number
  /** modo tempo */
  timeMinutes: number
  /** modo livre: primeiro a X pontos; null = contagem aberta */
  freeTarget: number | null
}

export interface Group {
  id: string
  name: string
  sport: Sport
  schedule: string
  ownerId: string
  admins: string[]
  members: string[]
  inviteToken: string
  preset: MatchConfig
  createdAt: number
}

export interface Player {
  id: string
  name: string
  color: string
  /** 1 a 5 em passos de 0,5 — visível só pra organizadores */
  stars: number
  active: boolean
  /** avulso: só pra hoje, fora da lista fixa */
  guest: boolean
  createdAt: number
}

export type TeamSound =
  | { kind: 'library'; libraryId: string; name: string }
  | { kind: 'recorded'; dataUrl: string; name: string }

/** gravação guardada no grupo — reaproveitável em qualquer partida e sincronizada entre aparelhos */
export interface GroupSound {
  id: string
  name: string
  dataUrl: string
  createdAt: number
}

export interface Team {
  name: string
  colorId: string
  playerIds: string[]
  pinned: string[]
  sound: TeamSound
}

/** parcial de um set anotado na mão: a = time 0, b = time 1 */
export interface ManualSet {
  a: number
  b: number
}

export type MatchEvent =
  | { type: 'point'; team: number; ts: number }
  | { type: 'set-close'; ts: number }

export interface Match {
  id: string
  groupId: string
  groupName: string
  /**
   * scheduled = rodada: times sorteados, container dos jogos da noite
   * live/finished = um jogo entre DOIS times (sempre dois, pro ranking bater)
   */
  status: 'scheduled' | 'live' | 'finished'
  /** id da rodada que originou este jogo (ausente em jogo avulso) */
  sessionId?: string
  /**
   * Placar digitado depois, sem ter usado o placar ao vivo.
   * Fica em campo próprio de propósito: inventar eventos falsos faria a
   * "corrida do placar" mentir. Quando existe, manda no lugar dos eventos.
   *
   * Formato de objeto ({a,b} = times 0 e 1) porque o Firestore NÃO aceita
   * array dentro de array — `number[][]` quebra o setDoc.
   */
  manualSets?: ManualSet[]
  /** quando a escalação foi salva; vira a hora do apito quando o jogo começa */
  startedAt: number
  finishedAt?: number
  config: MatchConfig
  teams: Team[]
  bench: string[]
  /** snapshot de nome/cor pra o histórico sobreviver a edições */
  players: Record<string, { name: string; color: string }>
  events: MatchEvent[]
  flip: boolean
  serveStart: number
  mvpPlayerId?: string
  liveToken: string
}

export const SPORTS: { id: Sport; label: string }[] = [
  { id: 'volei', label: 'Vôlei' },
  { id: 'futsal', label: 'Futsal' },
  { id: 'basquete', label: 'Basquete' },
  { id: 'beach', label: 'Beach tennis' },
  { id: 'outro', label: 'Outro' },
]

export function sportLabel(s: Sport): string {
  return SPORTS.find((x) => x.id === s)?.label ?? 'Esporte'
}

export function defaultConfig(sport: Sport): MatchConfig {
  const base: MatchConfig = {
    sport,
    numTeams: 2,
    playersPerTeam: 6,
    scoring: 'sets',
    setPoints: 25,
    advantage2: true,
    bestOf: 3,
    tiebreakPoints: 15,
    timeMinutes: 10,
    freeTarget: 12,
  }
  if (sport === 'futsal') return { ...base, playersPerTeam: 5, scoring: 'tempo' }
  if (sport === 'basquete') return { ...base, playersPerTeam: 5, scoring: 'tempo' }
  if (sport === 'beach') return { ...base, playersPerTeam: 2, setPoints: 21 }
  if (sport === 'outro') return { ...base, playersPerTeam: 5, scoring: 'livre' }
  return base
}
