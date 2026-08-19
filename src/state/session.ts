import { create } from 'zustand'
import { db, hasCloud } from '../data'
import type { Group, Sport, UserProfile } from '../data/types'
import { defaultConfig } from '../data/types'
import { newId, newToken } from '../lib/id'
import { migrateLocalToCloud } from '../data/migrate'
import { track } from '../lib/analytics'

interface SessionState {
  user: UserProfile | null
  ready: boolean
  groups: Group[]
  /** grupos do usuário já carregados ao menos uma vez (evita redirect precoce na home) */
  groupsLoaded: boolean
  init: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshGroups: () => Promise<void>
  createGroup: (name: string, sport: Sport, schedule: string) => Promise<Group>
  updateGroup: (group: Group) => Promise<void>
  /** aceita o convite e devolve o id do grupo (null = token inválido) */
  joinByToken: (token: string) => Promise<string | null>
}

let unsubAuth: (() => void) | null = null

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  ready: false,
  groups: [],
  groupsLoaded: false,

  init: () => {
    if (unsubAuth) return
    unsubAuth = db.onAuthChange(async (user) => {
      set({ user, ready: true })
      if (user) {
        if (hasCloud) await migrateLocalToCloud(db, user).catch(() => 0)
        await get().refreshGroups().catch(() => {})
      } else {
        set({ groups: [], groupsLoaded: false })
      }
    })
  },

  signIn: async () => {
    const user = await db.signIn()
    set({ user })
    track('login')
    if (hasCloud) await migrateLocalToCloud(db, user).catch(() => 0)
    await get().refreshGroups()
  },

  signOut: async () => {
    await db.signOut()
    set({ user: null, groups: [], groupsLoaded: false })
  },

  refreshGroups: async () => {
    const { user } = get()
    if (!user) return
    try {
      set({ groups: await db.listGroups(user.id), groupsLoaded: true })
    } catch (e) {
      // sem rede/permissão: libera a UI pra mostrar estado vazio em vez de travar
      console.error('[grupos]', e)
      set({ groupsLoaded: true })
    }
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
    track('grupo_criado', { esporte: sport })
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
    track('entrou_por_convite')
    // o refresh pode demorar (ou falhar offline) — o id já basta pra navegar
    await get().refreshGroups().catch(() => {})
    return found.id
  },
}))

export function isAdmin(group: Group | undefined, user: UserProfile | null): boolean {
  if (!group || !user) return false
  return group.admins.includes(user.id) || group.ownerId === user.id
}
