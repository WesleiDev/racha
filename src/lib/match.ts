import type { Match, MatchConfig, Player, Team } from '../data/types'
import { newId, newToken } from './id'
import { teamColor } from './colors'

/** monta a partida (escalação salva ou jogo começando) a partir do sorteio */
export function buildMatch(
  groupId: string,
  groupName: string,
  config: MatchConfig,
  teams: Team[],
  bench: string[],
  players: Player[],
  status: Match['status'],
): Match {
  const snapshot: Match['players'] = {}
  for (const p of players) snapshot[p.id] = { name: p.name, color: p.color }
  return {
    id: newId(),
    groupId,
    groupName,
    status,
    startedAt: Date.now(),
    config,
    teams,
    bench,
    players: snapshot,
    events: [],
    flip: false,
    serveStart: Math.random() < 0.5 ? 0 : 1,
    liveToken: newToken(4),
  }
}

/** jogo cujo placar foi digitado depois (ninguém marcou ao vivo) */
export function buildManualGame(session: Match, teamIdx: [number, number], sets: number[][]): Match {
  const [i, j] = teamIdx
  const base = buildMatch(
    session.groupId,
    session.groupName,
    session.config,
    [session.teams[i], session.teams[j]],
    session.bench,
    [],
    'finished',
  )
  return {
    ...base,
    sessionId: session.id,
    players: session.players,
    // objeto por set: o Firestore rejeita array dentro de array
    manualSets: sets.map(([a, b]) => ({ a, b })),
    finishedAt: Date.now(),
  }
}

/** texto pro grupo do WhatsApp: quem joga com quem + link */
export function lineupText(match: Match, url: string): string {
  const lines = match.teams.map((t) => {
    const nomes = t.playerIds.map((id) => match.players[id]?.name ?? '?').join(', ')
    return `${t.name.replace(/^Time /, '')}: ${nomes}`
  })
  if (match.bench.length > 0) {
    lines.push(`Banco: ${match.bench.map((id) => match.players[id]?.name ?? '?').join(', ')}`)
  }
  return [`🏐 ${match.groupName} — times sorteados`, '', ...lines, '', `Acompanha aqui: ${url}`].join('\n')
}

/** compartilha a escalação; devolve como foi (share nativo ou área de transferência) */
export async function shareLineup(match: Match, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const text = lineupText(match, url)
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      /* cancelou → tenta copiar */
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function teamColorHex(colorId: string): string {
  return teamColor(colorId).hex
}
