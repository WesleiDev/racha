import { create } from 'zustand'
import { db } from '../data'
import type { Match, Player } from '../data/types'

/** jogadores + partidas do grupo ativo */
interface RosterState {
  groupId: string | null
  players: Player[]
  matches: Match[]
  loading: boolean
  load: (groupId: string) => Promise<void>
  addPlayer: (p: Player) => Promise<void>
  updatePlayer: (p: Player) => Promise<void>
  removePlayer: (playerId: string) => Promise<void>
  saveMatch: (m: Match) => Promise<void>
}

export const useRoster = create<RosterState>((set, get) => ({
  groupId: null,
  players: [],
  matches: [],
  loading: false,

  load: async (groupId) => {
    set({ loading: true, groupId })
    const [players, matches] = await Promise.all([db.listPlayers(groupId), db.listMatches(groupId)])
    // se o usuário navegou pra outro grupo no meio do load, descarta
    if (get().groupId !== groupId) return
    set({ players, matches, loading: false })
  },

  addPlayer: async (p) => {
    const { groupId } = get()
    if (!groupId) return
    set({ players: [...get().players, p] })
    await db.savePlayer(groupId, p)
  },

  updatePlayer: async (p) => {
    const { groupId } = get()
    if (!groupId) return
    set({ players: get().players.map((x) => (x.id === p.id ? p : x)) })
    await db.savePlayer(groupId, p)
  },

  removePlayer: async (playerId) => {
    const { groupId } = get()
    if (!groupId) return
    set({ players: get().players.filter((x) => x.id !== playerId) })
    await db.deletePlayer(groupId, playerId)
  },

  saveMatch: async (m) => {
    const { groupId } = get()
    if (!groupId) return
    const rest = get().matches.filter((x) => x.id !== m.id)
    set({ matches: [m, ...rest].sort((a, b) => b.startedAt - a.startedAt) })
    await db.saveMatch(groupId, m)
  },
}))
