import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content } from '../components/layout'
import { TabBar } from '../components/tabbar'
import { Card, Dot, EmptyState } from '../components/ui'
import { useRoster } from '../state/roster'
import { teamColor } from '../lib/colors'
import { boardOf, allSets } from '../lib/scoring'
import { fmtDayParts, fmtDuration } from '../lib/format'
import { sportLabel } from '../data/types'

export function History() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { matches, load, groupId: loaded } = useRoster()

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const finished = matches.filter((m) => m.status === 'finished')

  return (
    <Screen>
      <Header back={`/g/${groupId}`} title="Histórico" sub={`${finished.length} ${finished.length === 1 ? 'partida' : 'partidas'}`} />
      <Content className="flex flex-col gap-2.5 pb-4">
        {finished.length === 0 && (
          <EmptyState
            emoji="📖"
            title="Nada registrado ainda"
            sub="Fecha a primeira partida que o histórico começa a contar a resenha."
          />
        )}
        {finished.map((m) => {
          const board = boardOf(m)
          const sets = allSets(board)
          const score = m.config.scoring === 'sets' ? board.setsWon : sets.at(-1) ?? [0, 0]
          const { day, month } = fmtDayParts(m.startedAt)
          const dur = ((m.finishedAt ?? m.startedAt) - m.startedAt) / 1000
          return (
            <Card key={m.id} onClick={() => nav(`/g/${groupId}/partida/${m.id}`)} className="rounded-[16px] px-4 py-3 flex items-center gap-4">
              <div className="text-center w-8 flex-none">
                <div className="num num-112 text-[17px] font-extrabold text-ink leading-none">{day}</div>
                <div className="text-[10.5px] font-bold text-dis tracking-wide">{month}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-semibold text-ink truncate">
                  {m.teams[0].name.replace(/^Time /, '')} × {m.teams[1]?.name.replace(/^Time /, '')}
                </div>
                <div className="text-[12px] text-ter mt-0.5">
                  {sportLabel(m.config.sport).toLowerCase()}
                  {m.config.scoring === 'sets' ? ` · ${sets.length} ${sets.length === 1 ? 'set' : 'sets'}` : ''} ·{' '}
                  {fmtDuration(dur)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-none">
                <Dot color={teamColor(m.teams[0].colorId).hex} size={7} />
                <span className="num num-118 text-[17px] font-extrabold text-ink">
                  {score[0]}–{score[1]}
                </span>
                <Dot color={teamColor(m.teams[1]?.colorId ?? 'laranja').hex} size={7} />
              </div>
            </Card>
          )
        })}
      </Content>
      <TabBar groupId={groupId} active="historico" />
    </Screen>
  )
}
