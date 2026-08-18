import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchConfig, Player, Team } from '../data/types'
import { defaultConfig } from '../data/types'
import { drawTeams } from '../lib/draw'
import { DEFAULT_SOUND } from '../lib/audio'
import { TEAM_COLORS, teamColor } from '../lib/colors'

/** fluxo de preparação: config → check-in → sorteio (persistido pra sobreviver a refresh) */
interface SetupState {
  groupId: string | null
  config: MatchConfig
  presentIds: string[]
  teams: Team[]
  bench: string[]
  begin: (groupId: string, preset: MatchConfig) => void
  setConfig: (patch: Partial<MatchConfig>) => void
  togglePresent: (playerId: string) => void
  draw: (players: Player[]) => void
  redraw: (players: Player[]) => void
  movePlayer: (playerId: string, toTeam: number | 'bench') => void
  togglePin: (playerId: string) => void
  renameTeam: (index: number, name: string) => void
  setTeamColor: (index: number, colorId: string) => void
  setTeamSound: (index: number, sound: Team['sound']) => void
  clearTeams: () => void
  reset: () => void
}

function makeTeam(index: number): Team {
  const color = TEAM_COLORS[index % TEAM_COLORS.length]
  return { name: `Time ${color.name}`, colorId: color.id, playerIds: [], pinned: [], sound: DEFAULT_SOUND }
}

export const useSetup = create<SetupState>()(
  persist(
    (set, get) => ({
      groupId: null,
      config: defaultConfig('volei'),
      presentIds: [],
      teams: [],
      bench: [],

      begin: (groupId, preset) => {
        const s = get()
        // volta pro fluxo do mesmo grupo mantém o progresso
        if (s.groupId === groupId && s.presentIds.length > 0) return
        set({ groupId, config: preset, presentIds: [], teams: [], bench: [] })
      },

      setConfig: (patch) => set({ config: { ...get().config, ...patch } }),

      togglePresent: (playerId) => {
        const cur = get().presentIds
        set({
          presentIds: cur.includes(playerId) ? cur.filter((id) => id !== playerId) : [...cur, playerId],
          teams: [],
          bench: [],
        })
      },

      draw: (players) => {
        const { config, presentIds } = get()
        const present = players.filter((p) => presentIds.includes(p.id))
        const result = drawTeams(present, config.numTeams, config.playersPerTeam)
        const teams = result.teams.map((ids, i) => ({ ...makeTeam(i), playerIds: ids }))
        set({ teams, bench: result.bench })
      },

      redraw: (players) => {
        const { config, presentIds, teams } = get()
        if (teams.length === 0) return get().draw(players)
        const present = players.filter((p) => presentIds.includes(p.id))
        const pinned = teams.map((t) => t.pinned)
        const result = drawTeams(present, config.numTeams, config.playersPerTeam, pinned)
        set({
          teams: teams.map((t, i) => ({ ...t, playerIds: result.teams[i] ?? [] })),
          bench: result.bench,
        })
      },

      movePlayer: (playerId, toTeam) => {
        const teams = get().teams.map((t) => ({
          ...t,
          playerIds: t.playerIds.filter((id) => id !== playerId),
          pinned: t.pinned.filter((id) => id !== playerId),
        }))
        let bench = get().bench.filter((id) => id !== playerId)
        if (toTeam === 'bench') bench = [...bench, playerId]
        else teams[toTeam] = { ...teams[toTeam], playerIds: [...teams[toTeam].playerIds, playerId] }
        set({ teams, bench })
      },

      togglePin: (playerId) => {
        set({
          teams: get().teams.map((t) => {
            if (!t.playerIds.includes(playerId)) return t
            const pinned = t.pinned.includes(playerId)
              ? t.pinned.filter((id) => id !== playerId)
              : [...t.pinned, playerId]
            return { ...t, pinned }
          }),
        })
      },

      renameTeam: (index, name) => {
        set({ teams: get().teams.map((t, i) => (i === index ? { ...t, name } : t)) })
      },

      setTeamColor: (index, colorId) => {
        set({
          teams: get().teams.map((t, i) => {
            if (i !== index) return t
            const wasDefault = t.name === `Time ${teamColor(t.colorId).name}`
            return { ...t, colorId, name: wasDefault ? `Time ${teamColor(colorId).name}` : t.name }
          }),
        })
      },

      setTeamSound: (index, sound) => {
        set({ teams: get().teams.map((t, i) => (i === index ? { ...t, sound } : t)) })
      },

      clearTeams: () => set({ teams: [], bench: [] }),

      reset: () => set({ groupId: null, presentIds: [], teams: [], bench: [] }),
    }),
    { name: 'racha.setup' },
  ),
)
