import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content } from '../components/layout'
import { Card, SectionLabel, Sheet } from '../components/ui'
import { IconEye } from '../components/icons'
import { useSession } from '../state/session'
import { useLive } from '../state/live'
import { SPORTS, sportLabel, type Sport } from '../data/types'
import { SPORT_ICONS } from '../components/icons'

export function GroupSettings() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { user, groups, updateGroup } = useSession()
  const group = groups.find((g) => g.id === groupId)
  const liveMatch = useLive((s) => s.match)
  const [pickingSport, setPickingSport] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!group) return <Screen />

  const inviteUrl = `${location.host}/entrar/${group.inviteToken}`
  const row = 'flex items-center justify-between px-4 py-3.5'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.protocol}//${inviteUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard bloqueado */
    }
  }

  const rename = () => {
    const name = prompt('Nome do grupo', group.name)?.trim()
    if (name) void updateGroup({ ...group, name })
  }

  const reschedule = () => {
    const schedule = prompt('Quando rola? (ex.: terça 20h)', group.schedule) ?? group.schedule
    void updateGroup({ ...group, schedule: schedule.trim() })
  }

  const hasLive = liveMatch && liveMatch.status === 'live' && liveMatch.groupId === groupId

  return (
    <Screen>
      <Header back={`/g/${groupId}`} title="Configurações" sub={group.name} />
      <Content className="flex flex-col gap-4 pb-6">
        <div>
          <SectionLabel className="mb-2">Grupo</SectionLabel>
          <Card className="divide-y divide-field">
            <button onClick={rename} className={`${row} w-full text-left`}>
              <span className="text-[14.5px] font-medium text-ink">Nome</span>
              <span className="text-[14px] text-ter">{group.name}</span>
            </button>
            <button onClick={() => setPickingSport(true)} className={`${row} w-full text-left`}>
              <span className="text-[14.5px] font-medium text-ink">Esporte padrão</span>
              <span className="text-[14px] text-ter">{sportLabel(group.sport)}</span>
            </button>
            <button onClick={reschedule} className={`${row} w-full text-left`}>
              <span className="text-[14.5px] font-medium text-ink">Horário</span>
              <span className="text-[14px] text-ter">{group.schedule || 'definir'}</span>
            </button>
            <div className={row}>
              <span className="text-[14.5px] font-medium text-ink">Tema</span>
              <span className="text-[14px] text-dis">Do sistema · escuro em breve</span>
            </div>
          </Card>
        </div>

        <div>
          <SectionLabel className="mb-2">Convite</SectionLabel>
          <div className="bg-accent-soft rounded-[18px] p-4">
            <div className="flex gap-2">
              <div className="flex-1 bg-white rounded-[12px] h-11 px-3.5 flex items-center text-[13.5px] text-ink font-medium overflow-hidden whitespace-nowrap">
                {inviteUrl}
              </div>
              <button
                onClick={() => void copy()}
                className="h-11 px-4 rounded-[12px] bg-accent text-white text-[13.5px] font-bold active:bg-accent-press"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="text-[12px] text-accent-press mt-2.5 font-medium">
              Quem abrir o link entra como membro.
            </div>
          </div>
        </div>

        <div>
          <SectionLabel className="mb-2">Organizadores</SectionLabel>
          <Card className="divide-y divide-field">
            <div className={row}>
              <span className="text-[14.5px] font-medium text-ink">{user?.name ?? 'Você'}</span>
              <span className="text-[12px] font-bold text-accent bg-accent-soft rounded-full px-2.5 py-1">criador</span>
            </div>
            {group.admins
              .filter((a) => a !== group.ownerId)
              .map((a) => (
                <div key={a} className={row}>
                  <span className="text-[14.5px] font-medium text-ink">{a}</span>
                  <span className="text-[12px] font-bold text-ter bg-field rounded-full px-2.5 py-1">admin</span>
                </div>
              ))}
          </Card>
        </div>

        <button
          onClick={() => hasLive && nav(`/ao-vivo/${liveMatch.liveToken}`)}
          className={`border border-dashed border-strong rounded-[16px] px-4 py-3.5 flex items-center gap-3 text-left ${
            hasLive ? 'active:bg-field' : 'opacity-60'
          }`}
        >
          <IconEye size={17} color="#57545F" />
          <span className="flex-1">
            <span className="block text-[14px] font-semibold text-ink">Ver placar ao vivo (espectador)</span>
            <span className="block text-[12px] text-ter mt-0.5">
              {hasLive
                ? `${location.host}/ao-vivo/${liveMatch.liveToken}`
                : 'o link aparece aqui enquanto tem partida rolando'}
            </span>
          </span>
        </button>
      </Content>

      <Sheet open={pickingSport} onClose={() => setPickingSport(false)}>
        <div className="px-5 pt-3 pb-2">
          <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em] mb-4">Esporte padrão</div>
          <div className="flex gap-2 flex-wrap">
            {SPORTS.map((s) => {
              const Icon = SPORT_ICONS[s.id]
              const active = group.sport === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    void updateGroup({ ...group, sport: s.id as Sport })
                    setPickingSport(false)
                  }}
                  className={`h-10 px-3.5 rounded-full border text-[13.5px] font-semibold flex items-center gap-2 ${
                    active ? 'bg-ink text-white border-ink' : 'bg-white text-sec border-knob2'
                  }`}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </Sheet>
    </Screen>
  )
}
