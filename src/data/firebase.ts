import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  type Firestore,
} from 'firebase/firestore'
import type { DataAdapter } from './adapter'
import type { Group, GroupSound, Match, Player, UserProfile } from './types'
import { firebaseConfig } from './firebaseConfig'

/**
 * Adapter Firestore — já pronto; ativa sozinho quando firebaseConfig deixar de ser null.
 *
 * Estrutura:
 *   users/{uid}                     → perfil
 *   groups/{gid}                    → grupo (members: uid[])
 *   groups/{gid}/players/{pid}      → jogadores
 *   groups/{gid}/sounds/{sid}       → gravações do grupo (base64, reaproveitáveis)
 *   groups/{gid}/matches/{mid}      → partidas (áudio dos times vai em base64 no doc)
 *   invites/{token}                 → resumo público p/ entrar por link
 *   live/{token}                    → partida ao vivo (leitura pública, espectador)
 *
 * Offline first: cache persistente do Firestore (IndexedDB) — o placar funciona
 * sem rede e sincroniza sozinho quando voltar.
 */

let auth: Auth | null = null
let db: Firestore | null = null

function init(): { auth: Auth; db: Firestore } {
  if (!auth || !db) {
    const app = initializeApp(firebaseConfig!)
    auth = getAuth(app)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  }
  return { auth, db }
}

function profileOf(u: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): UserProfile {
  return {
    id: u.uid,
    name: u.displayName ?? 'Você',
    email: u.email ?? undefined,
    photoUrl: u.photoURL ?? undefined,
  }
}

export const firebaseAdapter: DataAdapter = {
  kind: 'firebase',

  async signIn() {
    const { auth, db } = init()
    let cred
    try {
      cred = await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      if ((e as { code?: string }).code === 'auth/popup-blocked') {
        // popup bloqueado (Safari/PWA/webview) → segue pelo redirect; a página sai daqui
        await signInWithRedirect(auth, new GoogleAuthProvider())
        return new Promise<never>(() => {})
      }
      throw e
    }
    const user = profileOf(cred.user)
    await setDoc(doc(db, 'users', user.id), user, { merge: true })
    return user
  },

  async signOut() {
    const { auth } = init()
    await fbSignOut(auth)
  },

  onAuthChange(cb) {
    const { auth, db } = init()
    return onAuthStateChanged(auth, (u) => {
      const user = u ? profileOf(u) : null
      // garante o perfil salvo também no fluxo por redirect (que não passa pelo signIn)
      if (user) void setDoc(doc(db, 'users', user.id), user, { merge: true }).catch(() => {})
      cb(user)
    })
  },

  async listGroups(uid) {
    const { db } = init()
    const snap = await getDocs(query(collection(db, 'groups'), where('members', 'array-contains', uid)))
    return snap.docs.map((d) => d.data() as Group)
  },

  async saveGroup(group) {
    const { db } = init()
    await setDoc(doc(db, 'groups', group.id), group)
    await setDoc(doc(db, 'invites', group.inviteToken), {
      groupId: group.id,
      name: group.name,
      sport: group.sport,
      schedule: group.schedule,
    })
  },

  async deleteGroup(groupId) {
    const { db } = init()
    await deleteDoc(doc(db, 'groups', groupId))
  },

  async findGroupByInvite(token) {
    const { db } = init()
    const snap = await getDoc(doc(db, 'invites', token))
    if (!snap.exists()) return null
    const d = snap.data() as { groupId: string; name: string; sport: Group['sport']; schedule: string }
    return { id: d.groupId, name: d.name, sport: d.sport, schedule: d.schedule }
  },

  async joinGroup(groupId, uid) {
    const { db } = init()
    await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(uid) })
  },

  async listPlayers(groupId) {
    const { db } = init()
    const snap = await getDocs(collection(db, 'groups', groupId, 'players'))
    return snap.docs.map((d) => d.data() as Player)
  },

  async savePlayer(groupId, player) {
    const { db } = init()
    await setDoc(doc(db, 'groups', groupId, 'players', player.id), player)
  },

  async deletePlayer(groupId, playerId) {
    const { db } = init()
    await deleteDoc(doc(db, 'groups', groupId, 'players', playerId))
  },

  async listSounds(groupId) {
    const { db } = init()
    const snap = await getDocs(collection(db, 'groups', groupId, 'sounds'))
    return snap.docs.map((d) => d.data() as GroupSound).sort((a, b) => a.createdAt - b.createdAt)
  },

  async saveSound(groupId, sound) {
    const { db } = init()
    await setDoc(doc(db, 'groups', groupId, 'sounds', sound.id), sound)
  },

  async deleteSound(groupId, soundId) {
    const { db } = init()
    await deleteDoc(doc(db, 'groups', groupId, 'sounds', soundId))
  },

  async listMatches(groupId) {
    const { db } = init()
    const snap = await getDocs(query(collection(db, 'groups', groupId, 'matches'), orderBy('startedAt', 'desc')))
    return snap.docs.map((d) => d.data() as Match)
  },

  async saveMatch(groupId, match) {
    const { db } = init()
    await setDoc(doc(db, 'groups', groupId, 'matches', match.id), match)
  },

  async deleteMatch(groupId, matchId) {
    const { db } = init()
    await deleteDoc(doc(db, 'groups', groupId, 'matches', matchId))
  },

  async publishLive(match) {
    const { db } = init()
    await setDoc(doc(db, 'live', match.liveToken), match)
  },

  async clearLive(token) {
    const { db } = init()
    await deleteDoc(doc(db, 'live', token))
  },

  watchLive(token, cb) {
    const { db } = init()
    return onSnapshot(
      doc(db, 'live', token),
      (snap) => cb(snap.exists() ? (snap.data() as Match) : null),
      () => cb(null),
    )
  },
}
