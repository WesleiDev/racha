import { create } from 'zustand'
import { db, hasCloud } from '../data'
import type { Group, Sport, UserProfile } from '../data/types'
import { defaultConfig } from '../data/types'
import { newId, newToken } from '../lib/id'
import { migrateLocalToCloud } from '../data/migrate'

interface SessionState {
  user: UserProfile | null
  ready: boolean
  groups: Group[]
  init: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshGroups: () => Promise<void>
  createGroup: (name: string, sport: Sport, schedule: string) => Promise<Group>
  updateGroup: (group: Group) => Promise<void>
  joinByToken: (token: string) => Promise<Group | null>
}

let unsubAuth: (() => void) | null = null

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  ready: false,
  groups: [],

  init: () => {
    if (unsubAuth) return
    unsubAuth = db.onAuthChange(async (user) => {
      set({ user, ready: true })
      if (user) {
        if (hasCloud) await migrateLocalToCloud(db, user).catch(() => 0)
        await get().refreshGroups()
      } else {
        set({ groups: [] })
      }
    })
  },

  signIn: async () => {
    const user = await db.signIn()
    set({ user })
    if (hasCloud) await migrateLocalToCloud(db, user).catch(() => 0)
    await get().refreshGroups()
  },

  signOut: async () => {
    await db.signOut()
    set({ user: null, groups: [] })
  },

  refreshGroups: async () => {
    const { user } = get()
    if (!user) return
    set({ groups: await db.listGroups(user.id) })
  },

  createGroup: async (name, sport, schedule) => {
    const { user } = get()
    if (!user) throw new Error('sem sessão')
    const group: Group = {
      id: newId(),
      name,
      sport,
      schedule,
      ownerId: user.id,
      admins: [user.id],
      members: [user.id],
      inviteToken: newToken(5),
      preset: defaultConfig(sport),
      createdAt: Date.now(),
    }
    await db.saveGroup(group)
    set({ groups: [...get().groups, group] })
    return group
  },

  updateGroup: async (group) => {
    await db.saveGroup(group)
    set({ groups: get().groups.map((g) => (g.id === group.id ? group : g)) })
  },

  joinByToken: async (token) => {
    const { user } = get()
    if (!user) return null
    const found = await db.findGroupByInvite(token.trim().toLowerCase())
    if (!found) return null
    await db.joinGroup(found.id, user.id)
    await get().refreshGroups()
    return get().groups.find((g) => g.id === found.id) ?? null
  },
}))

export function isAdmin(group: Group | undefined, user: UserProfile | null): boolean {
  if (!group || !user) return false
  return group.admins.includes(user.id) || group.ownerId === user.id
}
