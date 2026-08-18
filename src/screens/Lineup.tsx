import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, Card, Dot, Modal, SectionLabel } from '../components/ui'
import { Avatar } from '../components/player'
import { IconCopy, IconShare, IconX } from '../components/icons'
import { useRoster } from '../state/roster'
import { useLive } from '../state/live'
import { db } from '../data'
import { teamColor } from '../lib/colors'
import { shareLineup } from '../lib/match'
import { sportLabel } from '../data/types'
import { fmtDayTime } from '../lib/format'
import { ensureCtx } from '../lib/audio'

/** escalação sorteada e salva: dá pra mandar no grupo agora e jogar depois */
export function Lineup() {
  const { groupId = '', matchId = '' } = useParams()
  const nav = useNavigate()
  const { matches, load, groupId: loaded, deleteMatch } = useRoster()
  const startFrom = useLive((s) => s.startFrom)
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmDrop, setConfirmDrop] = useState(false)

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const match = matches.find((m) => m.id === matchId)

  if (!match) {
    return (
      <Screen>
        <Header back={`/g/${groupId}`} title="Escalação" />
        <Content>
          <div className="text-[14px] text-ter text-center py-16">Escalação não encontrada.</div>
        </Content>
      </Screen>
    )
  }

  const url = `${location.origin}/ao-vivo/${match.liveToken}`

  const share = async () => {
    const r = await shareLineup(match, url)
    if (r === 'copied') setMsg('Copiado! É só colar no grupo.')
    if (r === 'failed') setMsg('Não rolou copiar — o link tá logo abaixo.')
    if (r !== 'shared') setTimeout(() => setMsg(null), 4000)
  }

  const play = () => {
    ensureCtx()
    const live = startFrom(match)
    void useRoster.getState().saveMatch(live)
    nav(`/g/${groupId}/placar`, { replace: true })
  }

  const drop = async () => {
    await deleteMatch(match.id)
    void db.clearLive(match.liveToken).catch(() => {})
    nav(`/g/${groupId}`, { replace: true })
  }

  return (
    <Screen>
      <Header
        back={`/g/${groupId}`}
        title="Times sorteados"
        sub={`${sportLabel(match.config.sport).toLowerCase()} · salvo ${fmtDayTime(match.startedAt)}`}
      />
      <Content className="flex flex-col gap-3 pb-4">
        <div className="bg-accent-soft text-accent-press rounded-[14px] px-3.5 py-3 text-[12.5px] font-medium leading-snug">
          Escalação guardada. Manda no grupo e, na hora do jogo, é só apertar “Começar partida”.
        </div>

        {match.teams.map((team, i) => {
          const c = teamColor(team.colorId)
          return (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: c.tint }}>
                <Dot color={c.hex} size={20} />
                <span className="flex-1 text-[16.5px] font-bold text-ink">{team.name}</span>
                <span className="text-[12px] font-semibold text-ter">{team.playerIds.length} jogadores</span>
              </div>
              <div className="px-4 py-2 flex flex-col">
                {team.playerIds.map((pid, k) => (
                  <span
                    key={pid}
                    className={`flex items-center gap-2.5 py-2 text-[14.5px] text-ink ${k > 0 ? 'border-t border-field' : ''}`}
                  >
                    <Avatar
                      name={match.players[pid]?.name ?? '?'}
                      color={match.players[pid]?.color ?? '#9A97A5'}
                      size={26}
                    />
                    {match.players[pid]?.name ?? '?'}
                  </span>
                ))}
              </div>
            </Card>
          )
        })}

        {match.bench.length > 0 && (
          <div className="border border-dashed border-strong rounded-[16px] px-4 py-3">
            <SectionLabel>Banco · quem ganha fica</SectionLabel>
            <div className="flex gap-2 flex-wrap mt-2">
              {match.bench.map((pid) => (
                <span
                  key={pid}
                  className="bg-white border border-cardline rounded-full pl-1 pr-3 py-1 flex items-center gap-2 text-[13px] text-ink"
                >
                  <Avatar
                    name={match.players[pid]?.name ?? '?'}
                    color={match.players[pid]?.color ?? '#9A97A5'}
                    size={22}
                  />
                  {match.players[pid]?.name ?? '?'}
                </span>
              ))}
            </div>
          </div>
        )}

        <Card className="p-4">
          <SectionLabel>Link pra galera ver</SectionLabel>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-field rounded-[12px] h-11 px-3.5 flex items-center text-[13px] text-ink overflow-hidden whitespace-nowrap">
              {url.replace(/^https?:\/\//, '')}
            </div>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(url).then(
                  () => setMsg('Link copiado!'),
                  () => setMsg('Não rolou copiar.'),
                )
                setTimeout(() => setMsg(null), 3000)
              }}
              className="h-11 px-3.5 rounded-[12px] border border-strong text-ink flex items-center gap-1.5 text-[13px] font-bold active:bg-field"
            >
              <IconCopy size={14} /> Copiar
            </button>
          </div>
          <div className="text-[12px] text-ter mt-2">
            O mesmo link vira o placar ao vivo quando a partida começar.
          </div>
        </Card>

        <button
          onClick={() => setConfirmDrop(true)}
          className="text-[13px] font-semibold text-danger py-2 flex items-center justify-center gap-1.5"
        >
          <IconX size={14} /> Descartar escalação
        </button>
      </Content>

      <BottomBar>
        {msg && <div className="text-[12.5px] text-success-ink text-center mb-2 font-semibold">{msg}</div>}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => void share()}
            className="h-[46px] rounded-[13px] border border-strong text-ink text-[14px] font-bold flex items-center justify-center gap-2 active:bg-field"
          >
            <IconShare size={15} /> Mandar no grupo
          </button>
          <Button variant="black" onClick={play}>
            Começar partida
          </Button>
        </div>
      </BottomBar>

      <Modal open={confirmDrop}>
        <div className="text-center">
          <div className="text-[17px] font-extrabold text-ink">Descartar essa escalação?</div>
          <div className="text-[13px] text-ter mt-1.5">Os times sorteados somem e o link para de funcionar.</div>
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={() => setConfirmDrop(false)}
              className="flex-1 h-12 rounded-[14px] bg-field text-ink text-[14px] font-bold"
            >
              Voltar
            </button>
            <button
              onClick={() => void drop()}
              className="flex-1 h-12 rounded-[14px] bg-danger text-white text-[14px] font-bold"
            >
              Descartar
            </button>
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
