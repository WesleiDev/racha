import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Screen, Header, Content } from '../components/layout'
import { TabBar } from '../components/tabbar'
import { Card, EmptyState } from '../components/ui'
import { Avatar } from '../components/player'
import { useRoster } from '../state/roster'
import { computeRanking, computeHighlights } from '../lib/rank'

export function Ranking() {
  const { groupId = '' } = useParams()
  const { matches, load, groupId: loaded } = useRoster()

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const ranking = computeRanking(matches)
  const highlights = computeHighlights(matches, ranking)
  const podium = ranking.slice(0, 3)
  const year = new Date().getFullYear()

  return (
    <Screen>
      <Header back={`/g/${groupId}`} title="Ranking" sub={`temporada ${year}`} />
      <Content className="flex flex-col gap-3 pb-4">
        {ranking.length === 0 ? (
          <EmptyState
            emoji="🏆"
            title="Ranking vazio (por enquanto)"
            sub="Cada partida salva conta jogos, vitórias e sequência de cada um."
          />
        ) : (
          <>
            {(highlights.topStreak || highlights.blowout) && (
              <div className="flex gap-2 flex-wrap">
                {highlights.topStreak && (
                  <span className="bg-accent-soft text-accent-press text-[12.5px] font-bold rounded-full px-3.5 py-2">
                    🔥 {highlights.topStreak.name} invicto há {highlights.topStreak.streak}
                  </span>
                )}
                {highlights.blowout && (
                  <span className="bg-notice text-notice-ink text-[12.5px] font-bold rounded-full px-3.5 py-2">
                    Maior lavada: {highlights.blowout.score}
                  </span>
                )}
              </div>
            )}

            {/* pódio */}
            {podium.length >= 2 && (
              <Card className="p-4 pt-5">
                <div className="flex items-end justify-center gap-3">
                  {[1, 0, 2].map((rank) => {
                    const r = podium[rank]
                    if (!r) return <div key={rank} className="w-[86px]" />
                    const heights = [82, 58, 44]
                    const first = rank === 0
                    return (
                      <div key={rank} className="flex flex-col items-center gap-1.5 w-[86px]">
                        <Avatar name={r.name} color={r.color} size={44} />
                        <span className="text-[13px] font-semibold text-ink truncate max-w-full">{r.name}</span>
                        <div
                          className={`w-full rounded-t-[12px] flex items-start justify-center pt-1.5 ${
                            first ? 'bg-accent' : 'bg-field'
                          }`}
                          style={{ height: heights[rank] }}
                        >
                          <span className={`num num-112 text-[15px] font-extrabold ${first ? 'text-white' : 'text-ter'}`}>
                            {rank + 1}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* tabela */}
            <Card className="overflow-hidden">
              <div className="grid grid-cols-[34px_1fr_44px_44px_56px] bg-subtle px-4 py-2.5 text-[10.5px] font-extrabold tracking-[0.08em] text-ter uppercase">
                <span>#</span>
                <span>Jogador</span>
                <span className="text-center">J</span>
                <span className="text-center">V</span>
                <span className="text-right">%</span>
              </div>
              {ranking.map((r, i) => (
                <div
                  key={r.playerId}
                  className={`grid grid-cols-[34px_1fr_44px_44px_56px] items-center px-4 py-2.5 ${
                    i > 0 ? 'border-t border-field' : ''
                  }`}
                >
                  <span className="num num-112 text-[13.5px] font-bold text-ter">{i + 1}</span>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={r.name} color={r.color} size={26} />
                    <span className="text-[14px] font-medium text-ink truncate">{r.name}</span>
                    {r.streak >= 2 && (
                      <span className="bg-success-soft text-success-ink text-[10px] font-extrabold rounded-full px-1.5 py-0.5 flex-none">
                        {r.streak}✓
                      </span>
                    )}
                  </span>
                  <span className="num num-112 text-[13.5px] text-sec text-center">{r.games}</span>
                  <span className="num num-112 text-[13.5px] text-sec text-center">{r.wins}</span>
                  <span className="num num-112 text-[14px] font-bold text-ink text-right">{r.pct}%</span>
                </div>
              ))}
            </Card>
          </>
        )}
      </Content>
      <TabBar groupId={groupId} active="ranking" />
    </Screen>
  )
}
