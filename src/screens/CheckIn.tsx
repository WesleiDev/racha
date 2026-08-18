import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, SearchField } from '../components/ui'
import { Avatar, Stars } from '../components/player'
import { IconCheck, IconPlus } from '../components/icons'
import { useRoster } from '../state/roster'
import { useSetup } from '../state/setup'
import { useSession, isAdmin } from '../state/session'

export function CheckIn() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { players, load, groupId: loaded } = useRoster()
  const { presentIds, togglePresent, config } = useSetup()
  const { user, groups } = useSession()
  const admin = isAdmin(groups.find((g) => g.id === groupId), user)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const list = useMemo(() => {
    const actives = players.filter((p) => p.active)
    const filtered = q ? actives.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : actives
    // presentes primeiro? handoff mostra lista única — mantém ordem alfabética, avulsos no fim
    return filtered.sort((a, b) => Number(a.guest) - Number(b.guest) || a.name.localeCompare(b.name, 'pt-BR'))
  }, [players, q])

  const count = presentIds.filter((id) => players.some((p) => p.id === id && p.active)).length
  const capacity = config.numTeams * config.playersPerTeam

  return (
    <Screen>
      <Header
        back
        title="Check-in"
        sub="Marca quem tá na quadra"
        right={
          <div className="text-right">
            <div className="num num-118 text-[26px] font-extrabold text-accent leading-none">{count}</div>
            <div className="text-[11px] text-ter font-semibold">presentes</div>
          </div>
        }
      />
      <Content className="flex flex-col gap-3 pb-4">
        <SearchField value={q} onChange={setQ} placeholder="Buscar" />

        <div className="flex flex-col gap-1.5">
          {list.map((p) => {
            const present = presentIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => togglePresent(p.id)}
                className={`flex items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors ${
                  present ? 'bg-white border border-cardline' : 'bg-paper'
                }`}
              >
                <Avatar name={p.name} color={p.color} dim={!present} />
                <span className={`flex-1 text-[15.5px] font-medium ${present ? 'text-ink' : 'text-dis'}`}>
                  {p.name}
                  {p.guest && <span className="text-[11px] text-ter font-semibold ml-1.5">avulso</span>}
                </span>
                {admin && <Stars value={p.stars} size={12.5} dim={!present} />}
                <span
                  className={`w-6 h-6 rounded-full flex-none flex items-center justify-center ${
                    present ? 'bg-success text-white' : 'border-2 border-knob2'
                  }`}
                >
                  {present && <IconCheck size={13} />}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => nav(`/g/${groupId}/jogadores/novo?de=checkin`)}
          className="border border-dashed border-strong rounded-[14px] h-12 text-[14px] font-semibold text-sec flex items-center justify-center gap-2 active:bg-field"
        >
          <IconPlus size={16} /> Avulso
        </button>

        {count > capacity && (
          <div className="text-[12.5px] text-ter text-center">
            {count} presentes pra {capacity} vagas — sobra vai pro banco (quem ganha fica).
          </div>
        )}
      </Content>

      <BottomBar>
        <Button onClick={() => nav(`/g/${groupId}/sorteio`)} disabled={count < 2}>
          Sorteia aí →
        </Button>
      </BottomBar>
    </Screen>
  )
}
