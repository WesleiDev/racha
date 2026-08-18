import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Content } from '../components/layout'
import { TabBar } from '../components/tabbar'
import { Card, Dot, IconCircleButton, SectionLabel } from '../components/ui'
import { Avatar } from '../components/player'
import { IconGear } from '../components/icons'
import { useSession } from '../state/session'
import { useRoster } from '../state/roster'
import { useLive } from '../state/live'
import { sportLabel } from '../data/types'
import { teamColor } from '../lib/colors'
import { computeBoard } from '../lib/scoring'
import { computeRanking } from '../lib/rank'
import { fmtDay } from '../lib/format'

const MEDAL = ['#FFB300', '#9A97A5', '#C08457']

export function GroupDashboard() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const group = useSession((s) => s.groups.find((g) => g.id === groupId))
  const { matches, load, groupId: loaded } = useRoster()
  const liveMatch = useLive((s) => s.match)

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  if (!group) return <Screen />

  const last = matches.find((m) => m.status === 'finished')
  const ranking = computeRanking(matches).slice(0, 3)
  const hasLive = liveMatch && liveMatch.status === 'live' && liveMatch.groupId === groupId

  return (
    <Screen>
      <div className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
            {sportLabel(group.sport)}
            {group.schedule ? ` · ${group.schedule}` : ''}
          </div>
          <h1 className="text-[28px] font-extrabold text-ink tracking-[-0.035em] leading-tight mt-0.5">
            {group.name}
          </h1>
        </div>
        <IconCircleButton onClick={() => nav(`/g/${groupId}/config`)} aria-label="Configurações">
          <IconGear size={17} />
        </IconCircleButton>
      </div>

      <Content className="flex flex-col gap-3 pb-4">
        {/* CTA principal */}
        <button
          onClick={() => nav(hasLive ? `/g/${groupId}/placar` : `/g/${groupId}/nova-partida`)}
          className="relative overflow-hidden rounded-[24px] p-6 text-left text-white active:opacity-95 transition-opacity"
          style={{ background: 'linear-gradient(150deg, #7C4DFF 0%, #5A28E8 100%)' }}
        >
          <span
            className="absolute rounded-full"
            style={{ width: 150, height: 150, border: '26px solid rgba(255,255,255,0.10)', top: -30, right: -30 }}
          />
          <span className="block text-[30px] font-extrabold tracking-[-0.035em] leading-none">
            {hasLive ? 'Voltar pro jogo' : 'Nova partida'}
          </span>
          <span className="block text-[14px] mt-2 text-white/78">
            {hasLive ? 'Tem partida rolando agora' : 'Bora jogar · sorteio em 3 toques'}
          </span>
        </button>

        {/* última partida */}
        {last && (
          <Card onClick={() => nav(`/g/${groupId}/partida/${last.id}`)} className="p-[18px]">
            <div className="flex items-center justify-between">
              <SectionLabel>Última partida · {fmtDay(last.startedAt)}</SectionLabel>
              <span className="text-[12.5px] font-semibold text-accent">ver</span>
            </div>
            <LastLine matchId={last.id} />
          </Card>
        )}

        {/* ranking resumido */}
        {ranking.length > 0 && (
          <Card onClick={() => nav(`/g/${groupId}/ranking`)} className="p-[18px]">
            <SectionLabel>Ranking do grupo</SectionLabel>
            <div className="mt-2.5 flex flex-col gap-2">
              {ranking.map((r, i) => (
                <div key={r.playerId} className="flex items-center gap-3">
                  <span className="w-4 text-[13.5px] font-extrabold num num-112" style={{ color: MEDAL[i] }}>
                    {i + 1}
                  </span>
                  <Avatar name={r.name} color={r.color} size={26} />
                  <span className="flex-1 text-[14.5px] font-medium text-ink">{r.name}</span>
                  <span className="num num-112 text-[13.5px] font-bold text-sec">{r.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Content>

      <TabBar groupId={groupId} active="grupo" />
    </Screen>
  )
}

function LastLine({ matchId }: { matchId: string }) {
  const match = useRoster((s) => s.matches.find((m) => m.id === matchId))
  if (!match) return null
  const board = computeBoard(match.config, match.events, match.serveStart, match.teams.length)
  const score = match.config.scoring === 'sets' ? board.setsWon : board.closedSets.at(-1) ?? board.current
  const [a, b] = match.teams
  return (
    <div className="flex items-center justify-between mt-2.5">
      <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Dot color={teamColor(a.colorId).hex} size={8} />
        {a.name.replace(/^Time /, '')}
      </span>
      <span className="num num-125 text-[24px] font-black text-ink">
        {score[0]} — {score[1]}
      </span>
      <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {b?.name.replace(/^Time /, '')}
        <Dot color={teamColor(b?.colorId ?? 'laranja').hex} size={8} />
      </span>
    </div>
  )
}
