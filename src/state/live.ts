import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../data'
import type { Match, MatchConfig, Player, Team } from '../data/types'
import { buildMatch } from '../lib/match'
import { computeBoard } from '../lib/scoring'
import { playTeamSound, preloadMatchSounds } from '../lib/audio'

/** partida em andamento — persiste a cada ponto: refresh/queda no meio do jogo não perde nada */
interface LiveState {
  match: Match | null
  /** cronômetro (modo tempo): ms acumulados + desde quando está correndo */
  elapsedMs: number
  runningSince: number | null

  start: (groupId: string, groupName: string, config: MatchConfig, teams: Team[], bench: string[], players: Player[]) => Match
  /**
   * Começa UM jogo da rodada entre dois dos times sorteados.
   * Cria registro próprio (id e link novos), então duas quadras podem rodar
   * em celulares diferentes sem uma sobrescrever a outra.
   */
  startGame: (session: Match, teamIdx: [number, number]) => Match
  point: (team: number) => void
  removeLastPointOf: (team: number) => void
  undo: () => void
  closeSet: () => void
  flipSides: () => void
  toggleClock: () => void
  finish: () => Match | null
  setMvp: (playerId: string | undefined) => void
  discard: () => void
}

function publish(match: Match): void {
  void db.publishLive(match).catch(() => {})
}

export const useLive = create<LiveState>()(
  persist(
    (set, get) => ({
      match: null,
      elapsedMs: 0,
      runningSince: null,

      start: (groupId, groupName, config, teams, bench, players) => {
        const match = buildMatch(groupId, groupName, config, teams, bench, players, 'live')
        set({ match, elapsedMs: 0, runningSince: config.scoring === 'tempo' ? null : Date.now() })
        void preloadMatchSounds(teams)
        publish(match)
        return match
      },

      startGame: (session, [i, j]) => {
        const teams = [session.teams[i], session.teams[j]]
        const match: Match = {
          ...buildMatch(
            session.groupId,
            session.groupName,
            session.config,
            teams,
            session.bench,
            [],
            'live',
          ),
          sessionId: session.id,
          // mantém os nomes de todo mundo (banco incluso) pro histórico não ficar com "?"
          players: session.players,
        }
        set({
          match,
          elapsedMs: 0,
          runningSince: match.config.scoring === 'tempo' ? null : Date.now(),
        })
        void preloadMatchSounds(teams)
        publish(match)
        return match
      },

      point: (team) => {
        const { match } = get()
        if (!match || match.status !== 'live') return
        const next: Match = { ...match, events: [...match.events, { type: 'point', team, ts: Date.now() }] }
        set({ match: next })
        void playTeamSound(match.teams[team].sound)
        publish(next)
      },

      removeLastPointOf: (team) => {
        const { match } = get()
        if (!match) return
        const idx = [...match.events]
          .map((e, i) => ({ e, i }))
          .reverse()
          .find(({ e }) => e.type === 'point' && e.team === team)?.i
        if (idx === undefined) return
        const next: Match = { ...match, events: match.events.filter((_, i) => i !== idx) }
        set({ match: next })
        publish(next)
      },

      undo: () => {
        const { match } = get()
        if (!match || match.events.length === 0) return
        const next: Match = { ...match, events: match.events.slice(0, -1) }
        set({ match: next })
        publish(next)
      },

      closeSet: () => {
        const { match } = get()
        if (!match) return
        const next: Match = { ...match, events: [...match.events, { type: 'set-close', ts: Date.now() }] }
        set({ match: next })
        publish(next)
      },

      flipSides: () => {
        const { match } = get()
        if (!match) return
        const next: Match = { ...match, flip: !match.flip }
        set({ match: next })
        publish(next)
      },

      toggleClock: () => {
        const { elapsedMs, runningSince } = get()
        if (runningSince) set({ elapsedMs: elapsedMs + (Date.now() - runningSince), runningSince: null })
        else set({ runningSince: Date.now() })
      },

      finish: () => {
        const { match, elapsedMs, runningSince } = get()
        if (!match) return null
        const extra = runningSince ? Date.now() - runningSince : 0
        const finished: Match = {
          ...match,
          status: 'finished',
          finishedAt: Date.now(),
        }
        set({ match: finished, elapsedMs: elapsedMs + extra, runningSince: null })
        void db.clearLive(match.liveToken).catch(() => {})
        return finished
      },

      setMvp: (playerId) => {
        const { match } = get()
        if (!match) return
        set({ match: { ...match, mvpPlayerId: playerId } })
      },

      discard: () => {
        const { match } = get()
        if (match) void db.clearLive(match.liveToken).catch(() => {})
        set({ match: null, elapsedMs: 0, runningSince: null })
      },
    }),
    { name: 'racha.live' },
  ),
)

/** estado derivado do placar da partida ao vivo */
export function useBoard() {
  const match = useLive((s) => s.match)
  if (!match) return null
  return computeBoard(match.config, match.events, match.serveStart, match.teams.length)
}
