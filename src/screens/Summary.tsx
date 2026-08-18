import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/layout'
import { Dot } from '../components/ui'
import { Avatar } from '../components/player'
import { useRoster } from '../state/roster'
import { useLive } from '../state/live'
import { useSession } from '../state/session'
import { teamColor, TEAM_COLORS } from '../lib/colors'
import { boardOf, allSets } from '../lib/scoring'
import { matchWinner } from '../lib/rank'
import { fmtDayTime, fmtDuration } from '../lib/format'
import { ensureCtx } from '../lib/audio'

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: Math.random() * 100,
        size: 5 + Math.random() * 2,
        color: TEAM_COLORS[i % TEAM_COLORS.length].hex,
        delay: Math.random() * 2.4,
        dur: 2.6 + Math.random() * 1.8,
      })),
    [],
  )
  return (
    <div className="absolute inset-x-0 top-0 h-[300px] overflow-hidden pointer-events-none">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-[2px]"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `rachaFall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export function Summary() {
  const { groupId = '', matchId = '' } = useParams()
  const nav = useNavigate()
  const { matches, saveMatch, players } = useRoster()
  const live = useLive()
  const group = useSession((s) => s.groups.find((g) => g.id === groupId))

  const match = matches.find((m) => m.id === matchId) ?? (live.match?.id === matchId ? live.match : null)

  if (!match) {
    return (
      <Screen dark>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-ondark text-[15px]">Partida não encontrada.</div>
          <button onClick={() => nav(`/g/${groupId}`)} className="text-lime text-[14px] font-bold">
            voltar pro grupo
          </button>
        </div>
      </Screen>
    )
  }

  const board = boardOf(match)
  const sets = allSets(board)
  const winner = matchWinner(match)
  const loser = winner === null ? null : winner === 0 ? 1 : 0
  const [a, b] = match.teams
  const short = (i: number) => match.teams[i].name.replace(/^Time /, '')
  const score = match.config.scoring === 'sets' ? board.setsWon : sets.at(-1) ?? [0, 0]
  const duration = (match.finishedAt ?? Date.now()) - match.startedAt
  const playerCount = match.teams.reduce((n, t) => n + t.playerIds.length, 0)

  const mvpCandidates = winner !== null ? match.teams[winner].playerIds : []

  const setMvp = (pid: string | undefined) => {
    const updated = { ...match, mvpPlayerId: pid }
    void saveMatch(updated).catch((e) => console.error('[salvar partida]', e))
    if (live.match?.id === match.id) live.setMvp(pid)
  }

  const finishAndGo = () => {
    live.discard()
    nav(`/g/${groupId}`, { replace: true })
  }

  const rematch = () => {
    ensureCtx()
    live.discard()
    live.start(groupId, group?.name ?? match.groupName, match.config, match.teams, match.bench, players)
    nav(`/g/${groupId}/placar`, { replace: true })
  }

  return (
    <Screen dark>
      <Confetti />
      <div className="px-6 pt-[max(46px,env(safe-area-inset-top))] pb-2 relative">
        <div className="text-lime text-[11px] font-extrabold tracking-[0.12em] uppercase">
          {winner === null ? 'Ninguém levou' : `Deu ruim pro ${match.teams[loser!].name}`}
        </div>
        <h1 className="text-white text-[34px] font-extrabold tracking-[-0.035em] leading-[1.05] mt-2">
          {winner === null ? (
            <>
              Empate técnico
              <br />
              no rachão
            </>
          ) : (
            <>
              {short(winner)} levou
              <br />o rachão
            </>
          )}
        </h1>
      </div>

      <div className="px-6 mt-4 relative">
        <div className="rounded-[22px] bg-white/6 border border-white/10 p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white text-[15px] font-bold min-w-0">
              <Dot color={teamColor(a.colorId).hex} size={10} />
              <span className="truncate">{short(0)}</span>
            </span>
            <span className="num num-125 text-white text-[52px] font-black leading-none px-3">
              {score[0]}<span className="text-ondark-faint mx-1">–</span>{score[1]}
            </span>
            <span className="flex items-center gap-2 text-white text-[15px] font-bold min-w-0">
              <span className="truncate">{short(1)}</span>
              <Dot color={teamColor(b.colorId).hex} size={10} />
            </span>
          </div>

          {match.config.scoring === 'sets' && sets.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {sets.map((s, i) => {
                const won0 = s[0] > s[1]
                return (
                  <div key={i} className="bg-white/5 rounded-[12px] py-2.5 text-center">
                    <div className="text-ondark-ter text-[9.5px] font-extrabold tracking-[0.1em]">SET {i + 1}</div>
                    <div className={`num num-118 text-[15px] font-bold mt-0.5 ${won0 ? 'text-white' : 'text-ondark-ter'}`}>
                      {s[0]}-{s[1]}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="border-t border-white/10 mt-4 pt-3 text-ondark-ter text-[12px] text-center">
            {fmtDuration(duration / 1000)} · {playerCount} jogadores · {fmtDayTime(match.startedAt)}
          </div>
        </div>

        {/* MVP */}
        {mvpCandidates.length > 0 && (
          <div className="mt-4">
            <div className="text-ondark-ter text-[11px] font-extrabold tracking-[0.1em] uppercase mb-2">
              MVP da partida (sai no card)
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mvpCandidates.map((pid) => {
                const p = match.players[pid]
                if (!p) return null
                const selected = match.mvpPlayerId === pid
                return (
                  <button
                    key={pid}
                    onClick={() => setMvp(selected ? undefined : pid)}
                    className={`flex items-center gap-2 rounded-full pl-1 pr-3 py-1 flex-none border transition-colors ${
                      selected ? 'bg-lime border-lime text-ink' : 'bg-white/8 border-white/10 text-white'
                    }`}
                  >
                    <Avatar name={p.name} color={p.color} size={24} />
                    <span className="text-[13px] font-semibold">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="px-6 pb-[max(28px,env(safe-area-inset-bottom))] flex flex-col gap-2.5 relative">
        <button
          onClick={() => nav(`/g/${groupId}/card/${match.id}`)}
          className="h-[54px] rounded-[15px] bg-lime text-ink text-[16px] font-bold active:opacity-85"
        >
          Compartilhar no grupo
        </button>
        <div className="flex gap-2.5">
          {match.sessionId ? (
            <button
              onClick={() => {
                live.discard()
                nav(`/g/${groupId}/escalacao/${match.sessionId}`, { replace: true })
              }}
              className="flex-1 h-12 rounded-[14px] bg-white/10 text-white text-[14.5px] font-bold active:bg-white/20"
            >
              Próximo jogo
            </button>
          ) : (
            <button
              onClick={finishAndGo}
              className="flex-1 h-12 rounded-[14px] bg-white/10 text-white text-[14.5px] font-bold active:bg-white/20"
            >
              Salvar
            </button>
          )}
          <button
            onClick={rematch}
            className="flex-1 h-12 rounded-[14px] border border-white/25 text-white text-[14.5px] font-bold active:bg-white/10"
          >
            Revanche
          </button>
        </div>
        {match.sessionId && (
          <button onClick={finishAndGo} className="text-ondark-ter text-[13px] font-semibold py-1">
            voltar pro grupo
          </button>
        )}
      </div>
    </Screen>
  )
}
