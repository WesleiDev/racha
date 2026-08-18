import { create } from 'zustand'
import { db } from '../data'
import type { GroupSound, Match, Player } from '../data/types'

/** jogadores, partidas e sons do grupo ativo */
interface RosterState {
  groupId: string | null
  players: Player[]
  matches: Match[]
  sounds: GroupSound[]
  loading: boolean
  load: (groupId: string) => Promise<void>
  addPlayer: (p: Player) => Promise<void>
  updatePlayer: (p: Player) => Promise<void>
  removePlayer: (playerId: string) => Promise<void>
  saveMatch: (m: Match) => Promise<void>
  deleteMatch: (matchId: string) => Promise<void>
  addSound: (s: GroupSound) => Promise<void>
  removeSound: (soundId: string) => Promise<void>
}

export const useRoster = create<RosterState>((set, get) => ({
  groupId: null,
  players: [],
  matches: [],
  sounds: [],
  loading: false,

  load: async (groupId) => {
    set({ loading: true, groupId })
    try {
      const [players, matches, sounds] = await Promise.all([
        db.listPlayers(groupId),
        db.listMatches(groupId),
        db.listSounds(groupId).catch(() => [] as GroupSound[]),
      ])
      // se o usuário navegou pra outro grupo no meio do load, descarta
      if (get().groupId !== groupId) return
      set({ players, matches, sounds, loading: false })
    } catch (e) {
      console.error('[grupo]', e)
      if (get().groupId === groupId) set({ players: [], matches: [], sounds: [], loading: false })
    }
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

  deleteMatch: async (matchId) => {
    const { groupId } = get()
    if (!groupId) return
    set({ matches: get().matches.filter((m) => m.id !== matchId) })
    await db.deleteMatch(groupId, matchId)
  },

  addSound: async (s) => {
    const { groupId } = get()
    if (!groupId) return
    set({ sounds: [...get().sounds.filter((x) => x.id !== s.id), s] })
    await db.saveSound(groupId, s)
  },

  removeSound: async (soundId) => {
    const { groupId } = get()
    if (!groupId) return
    set({ sounds: get().sounds.filter((s) => s.id !== soundId) })
    await db.deleteSound(groupId, soundId)
  },
}))
