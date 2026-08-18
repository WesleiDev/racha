import type { DataAdapter } from './adapter'
import type { Group, Match, Player, UserProfile } from './types'
import { localAdapter } from './local'

const FLAG = 'racha.migrated'

/**
 * No primeiro login com o Firebase conectado, sobe pra nuvem tudo que foi
 * criado enquanto o app rodava só local (grupos, jogadores, partidas, áudios) —
 * o usuário não perde nada do que já organizou.
 */
export async function migrateLocalToCloud(cloud: DataAdapter, user: UserProfile): Promise<number> {
  if (cloud.kind !== 'firebase') return 0
  if (localStorage.getItem(FLAG)) return 0

  const localUser: UserProfile = { id: 'local', name: 'Você' }
  const groups: Group[] = await localAdapter.listGroups(localUser.id)
  let moved = 0

  for (const g of groups) {
    const cloudGroup: Group = {
      ...g,
      ownerId: user.id,
      admins: [user.id],
      members: [user.id],
    }
    await cloud.saveGroup(cloudGroup)
    const players: Player[] = await localAdapter.listPlayers(g.id)
    for (const p of players) await cloud.savePlayer(g.id, p)
    const matches: Match[] = await localAdapter.listMatches(g.id)
    for (const m of matches) await cloud.saveMatch(g.id, m)
    moved += 1 + players.length + matches.length
  }

  localStorage.setItem(FLAG, String(Date.now()))
  return moved
}
