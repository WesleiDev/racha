import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Screen, Header, Content } from '../components/layout'
import { Card, Dot, SectionLabel } from '../components/ui'
import { useRoster } from '../state/roster'
import { teamColor } from '../lib/colors'
import { boardOf, allSets } from '../lib/scoring'
import { fmtDay, fmtDuration } from '../lib/format'
import { sportLabel } from '../data/types'
import type { Match } from '../data/types'

/** corrida do placar de um set: polilinhas cumulativas por rally */
function RaceChart({ match, setIndex }: { match: Match; setIndex: number }) {
  const lines = useMemo(() => {
    // reconstrói a sequência de pontos do set escolhido
    let set = 0
    const seq: number[] = []
    for (const ev of match.events) {
      if (ev.type === 'set-close') set += 1
      else if (ev.type === 'point' && set === setIndex) seq.push(ev.team)
    }
    const totals = [0, 0]
    const pts: [number, number][][] = [[[0, 0]], [[0, 0]]] as unknown as [number, number][][]
    seq.forEach((team, i) => {
      totals[team] += 1
      pts[0].push([i + 1, totals[0]])
      pts[1].push([i + 1, totals[1]])
    })
    const maxX = Math.max(seq.length, 1)
    const maxY = Math.max(totals[0], totals[1], 1)
    return { pts, maxX, maxY }
  }, [match, setIndex])

  const W = 300
  const H = 90
  const toSvg = (line: [number, number][]) =>
    line.map(([x, y]) => `${((x / lines.maxX) * (W - 8) + 4).toFixed(1)},${(H - 6 - (y / lines.maxY) * (H - 14)).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1="4" y1={H - 6} x2={W - 4} y2={H - 6} stroke="#EFEDE7" strokeWidth="2" />
      {[0, 1].map((t) => (
        <polyline
          key={t}
          points={toSvg(lines.pts[t])}
          fill="none"
          stroke={teamColor(match.teams[t].colorId).hex}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export function MatchDetail() {
  const { groupId = '', matchId = '' } = useParams()
  const { matches, load, groupId: loaded, players } = useRoster()
  const match = matches.find((m) => m.id === matchId)
  const [setIdx, setSetIdx] = useState(0)

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  useEffect(() => {
    if (match) {
      const board = boardOf(match)
      setSetIdx(Math.max(0, allSets(board).length - 1))
    }
  }, [match?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return <Screen />

  const board = boardOf(match)
  const manual = Boolean(match.manualSets?.length)
  const sets = allSets(board)
  const score = match.config.scoring === 'sets' ? board.setsWon : sets.at(-1) ?? [0, 0]
  const dur = ((match.finishedAt ?? match.startedAt) - match.startedAt) / 1000
  const short = (i: number) => match.teams[i].name.replace(/^Time /, '')
  const nameOf = (pid: string) => match.players[pid]?.name ?? players.find((p) => p.id === pid)?.name ?? '?'

  return (
    <Screen>
      <Header
        back={`/g/${groupId}/historico`}
        title={`${short(0)} ${score[0]} × ${score[1]} ${short(1)}`}
        sub={`${fmtDay(match.startedAt)} · ${sportLabel(match.config.sport).toLowerCase()} · ${fmtDuration(dur)}`}
      />
      <Content className="flex flex-col gap-3 pb-6">
        {match.config.scoring === 'sets' && sets.length > 0 && (
          <Card className="p-4">
            <SectionLabel>Sets</SectionLabel>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {sets.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSetIdx(i)}
                  className={`rounded-[12px] py-2.5 text-center border transition-colors ${
                    setIdx === i ? 'border-accent bg-accent-soft' : 'border-cardline bg-subtle'
                  }`}
                >
                  <div className="text-[9.5px] font-extrabold tracking-[0.1em] text-ter">SET {i + 1}</div>
                  <div className="num num-118 text-[15px] font-bold text-ink mt-0.5">
                    {s[0]}-{s[1]}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* sem timeline de pontos num resultado anotado — não inventa gráfico */}
        {manual ? (
          <Card className="p-4">
            <SectionLabel>Resultado anotado</SectionLabel>
            <div className="text-[13px] text-ter mt-2 leading-relaxed">
              Este placar foi lançado depois do jogo, então não tem a corrida do placar ponto a ponto.
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <SectionLabel>
              Corrida do placar{match.config.scoring === 'sets' ? ` · ${setIdx + 1}º set` : ''}
            </SectionLabel>
            <div className="mt-3">
              <RaceChart match={match} setIndex={setIdx} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              {match.teams.slice(0, 2).map((t, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[12px] font-semibold text-sec">
                  <Dot color={teamColor(t.colorId).hex} size={7} /> {short(i)}
                </span>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {match.teams.slice(0, 2).map((team, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dot color={teamColor(team.colorId).hex} size={9} />
                <span className="text-[14px] font-bold text-ink truncate">{short(i)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {team.playerIds.map((pid) => (
                  <span key={pid} className="text-[13.5px] text-sec">
                    {nameOf(pid)}
                    {match.mvpPlayerId === pid && (
                      <span className="text-[10px] font-extrabold text-notice-ink bg-notice rounded-full px-1.5 py-0.5 ml-1.5">
                        MVP
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Content>
    </Screen>
  )
}
