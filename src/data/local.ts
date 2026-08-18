import type { DataAdapter } from './adapter'
import type { Group, GroupSound, Match, Player, UserProfile } from './types'

// as chaves mantêm o prefixo "racha." de antes do rename pra TemJogo —
// trocar apagaria os dados já salvos nos aparelhos
const K = {
  user: 'racha.user',
  groups: 'racha.groups',
  players: (gid: string) => `racha.players.${gid}`,
  sounds: (gid: string) => `racha.sounds.${gid}`,
  matches: (gid: string) => `racha.matches.${gid}`,
  live: (token: string) => `racha.live.${token}`,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

const authListeners = new Set<(u: UserProfile | null) => void>()
const liveChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('racha-live') : null

/**
 * Observadores desta aba. O BroadcastChannel não entrega pra própria instância
 * que publicou (e `storage` também não dispara na aba que escreveu), então
 * uma escrita local precisa avisar os observadores daqui na mão.
 */
const matchListeners = new Set<(groupId: string) => void>()

function notifyMatches(groupId: string): void {
  matchListeners.forEach((cb) => cb(groupId))
  liveChannel?.postMessage({ matches: groupId })
}

/**
 * Adapter padrão: tudo no localStorage do aparelho.
 * O "login com Google" vira uma sessão local até o Firebase ser conectado —
 * os dados criados aqui são migrados pra nuvem no primeiro login real (ver migrate.ts).
 */
export const localAdapter: DataAdapter = {
  kind: 'local',

  async signIn() {
    const user: UserProfile = read<UserProfile | null>(K.user, null) ?? {
      id: 'local',
      name: 'Você',
    }
    write(K.user, user)
    authListeners.forEach((cb) => cb(user))
    return user
  },

  async signOut() {
    localStorage.removeItem(K.user)
    authListeners.forEach((cb) => cb(null))
  },

  onAuthChange(cb) {
    authListeners.add(cb)
    cb(read<UserProfile | null>(K.user, null))
    return () => authListeners.delete(cb)
  },

  async listGroups(uid) {
    return read<Group[]>(K.groups, []).filter((g) => g.members.includes(uid))
  },

  async saveGroup(group) {
    const all = read<Group[]>(K.groups, [])
    const i = all.findIndex((g) => g.id === group.id)
    if (i >= 0) all[i] = group
    else all.push(group)
    write(K.groups, all)
  },

  async deleteGroup(groupId) {
    write(K.groups, read<Group[]>(K.groups, []).filter((g) => g.id !== groupId))
    localStorage.removeItem(K.players(groupId))
    localStorage.removeItem(K.matches(groupId))
  },

  async findGroupByInvite(token) {
    return read<Group[]>(K.groups, []).find((g) => g.inviteToken === token) ?? null
  },

  async joinGroup(groupId, uid) {
    const all = read<Group[]>(K.groups, [])
    const g = all.find((x) => x.id === groupId)
    if (g && !g.members.includes(uid)) {
      g.members.push(uid)
      write(K.groups, all)
    }
  },

  async listPlayers(groupId) {
    return read<Player[]>(K.players(groupId), [])
  },

  async savePlayer(groupId, player) {
    const all = read<Player[]>(K.players(groupId), [])
    const i = all.findIndex((p) => p.id === player.id)
    if (i >= 0) all[i] = player
    else all.push(player)
    write(K.players(groupId), all)
  },

  async deletePlayer(groupId, playerId) {
    write(K.players(groupId), read<Player[]>(K.players(groupId), []).filter((p) => p.id !== playerId))
  },

  async listSounds(groupId) {
    return read<GroupSound[]>(K.sounds(groupId), [])
  },

  async saveSound(groupId, sound) {
    const all = read<GroupSound[]>(K.sounds(groupId), [])
    const i = all.findIndex((s) => s.id === sound.id)
    if (i >= 0) all[i] = sound
    else all.push(sound)
    write(K.sounds(groupId), all)
  },

  async deleteSound(groupId, soundId) {
    write(K.sounds(groupId), read<GroupSound[]>(K.sounds(groupId), []).filter((s) => s.id !== soundId))
  },

  async listMatches(groupId) {
    return read<Match[]>(K.matches(groupId), []).sort((a, b) => b.startedAt - a.startedAt)
  },

  async saveMatch(groupId, match) {
    const all = read<Match[]>(K.matches(groupId), [])
    const i = all.findIndex((m) => m.id === match.id)
    if (i >= 0) all[i] = match
    else all.push(match)
    write(K.matches(groupId), all)
    notifyMatches(groupId)
  },

  async deleteMatch(groupId, matchId) {
    write(K.matches(groupId), read<Match[]>(K.matches(groupId), []).filter((m) => m.id !== matchId))
    notifyMatches(groupId)
  },

  watchSessionMatches(groupId, sessionId, cb) {
    const emit = () =>
      cb(
        read<Match[]>(K.matches(groupId), [])
          .filter((m) => m.sessionId === sessionId)
          .sort((a, b) => a.startedAt - b.startedAt),
      )
    const onStorage = (e: StorageEvent) => {
      if (e.key === K.matches(groupId)) emit()
    }
    const onMessage = (e: MessageEvent) => {
      if (e.data?.matches === groupId) emit()
    }
    const onLocal = (gid: string) => {
      if (gid === groupId) emit()
    }
    window.addEventListener('storage', onStorage)
    liveChannel?.addEventListener('message', onMessage)
    matchListeners.add(onLocal)
    emit()
    return () => {
      window.removeEventListener('storage', onStorage)
      liveChannel?.removeEventListener('message', onMessage)
      matchListeners.delete(onLocal)
    }
  },

  async publishLive(match) {
    write(K.live(match.liveToken), match)
    liveChannel?.postMessage({ token: match.liveToken })
  },

  async clearLive(token) {
    localStorage.removeItem(K.live(token))
    liveChannel?.postMessage({ token })
  },

  watchLive(token, cb) {
    const emit = () => cb(read<Match | null>(K.live(token), null))
    const onStorage = (e: StorageEvent) => {
      if (e.key === K.live(token)) emit()
    }
    const onMessage = (e: MessageEvent) => {
      if (e.data?.token === token) emit()
    }
    window.addEventListener('storage', onStorage)
    liveChannel?.addEventListener('message', onMessage)
    emit()
    return () => {
      window.removeEventListener('storage', onStorage)
      liveChannel?.removeEventListener('message', onMessage)
    }
  },
}
