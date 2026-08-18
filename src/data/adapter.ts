import type { Group, GroupSound, Match, Player, UserProfile } from './types'

/**
 * Contrato único de persistência. Duas implementações:
 *  - localAdapter  → localStorage (padrão, funciona 100% offline)
 *  - firebaseAdapter → Auth Google + Firestore (ativa sozinho quando houver config)
 * A troca é transparente pro resto do app.
 */
export interface DataAdapter {
  kind: 'local' | 'firebase'

  /* ---- auth ---- */
  signIn(): Promise<UserProfile>
  signOut(): Promise<void>
  /** dispara imediatamente com o usuário atual (ou null) e a cada mudança */
  onAuthChange(cb: (user: UserProfile | null) => void): () => void

  /* ---- grupos ---- */
  listGroups(uid: string): Promise<Group[]>
  saveGroup(group: Group): Promise<void>
  deleteGroup(groupId: string): Promise<void>
  findGroupByInvite(token: string): Promise<Pick<Group, 'id' | 'name' | 'sport' | 'schedule'> | null>
  joinGroup(groupId: string, uid: string): Promise<void>

  /* ---- jogadores ---- */
  listPlayers(groupId: string): Promise<Player[]>
  savePlayer(groupId: string, player: Player): Promise<void>
  deletePlayer(groupId: string, playerId: string): Promise<void>

  /* ---- sons gravados do grupo ---- */
  listSounds(groupId: string): Promise<GroupSound[]>
  saveSound(groupId: string, sound: GroupSound): Promise<void>
  deleteSound(groupId: string, soundId: string): Promise<void>

  /* ---- partidas ---- */
  listMatches(groupId: string): Promise<Match[]>
  saveMatch(groupId: string, match: Match): Promise<void>
  deleteMatch(groupId: string, matchId: string): Promise<void>

  /* ---- placar ao vivo (espectador) ---- */
  publishLive(match: Match): Promise<void>
  clearLive(token: string): Promise<void>
  watchLive(token: string, cb: (match: Match | null) => void): () => void
}
