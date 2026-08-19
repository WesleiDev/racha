import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen, Content } from '../components/layout'
import { Button, Card, Dot, Sheet, AutoFocusInput } from '../components/ui'
import { useSession } from '../state/session'
import { db } from '../data'
import type { Group, Match, Sport } from '../data/types'
import { SPORTS, sportLabel } from '../data/types'
import { SPORT_ICONS } from '../components/icons'
import { teamColor } from '../lib/colors'
import { boardOf } from '../lib/scoring'
import { initials } from '../lib/colors'

function GroupCard({ group }: { group: Group }) {
  const nav = useNavigate()
  const [last, setLast] = useState<Match | null>(null)
  useEffect(() => {
    void db.listMatches(group.id).then((ms) => setLast(ms.find((m) => m.status === 'finished') ?? null))
  }, [group.id])

  return (
    <Card onClick={() => nav(`/g/${group.id}`)} className={`p-4.5 p-[18px] ${last ? '' : 'opacity-[0.72]'}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
        {sportLabel(group.sport)}
        <span className="w-1 h-1 rounded-full bg-strong inline-block" />
        <span className="text-ter font-semibold normal-case tracking-normal text-[11.5px]">
          {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>
      <div className="text-[22px] font-bold text-ink tracking-[-0.02em] mt-1">{group.name}</div>
      <div className="border-t border-field mt-3 pt-3 text-[13px] text-ter flex items-center gap-2">
        {last ? (
          <>
            <span>Última:</span>
            <span className="flex items-center gap-1.5 font-semibold text-sec">
              <Dot color={teamColor(last.teams[0].colorId).hex} size={7} />
              <LastScore match={last} />
              <Dot color={teamColor(last.teams[1]?.colorId ?? 'laranja').hex} size={7} />
            </span>
          </>
        ) : (
          <span>Nenhuma partida ainda</span>
        )}
      </div>
    </Card>
  )
}

function LastScore({ match }: { match: Match }) {
  const board = boardOf(match)
  const score =
    match.config.scoring === 'sets'
      ? board.setsWon
      : [...board.closedSets, board.current].reduce((acc, s) => [acc[0] + (s[0] ?? 0), acc[1] + (s[1] ?? 0)], [0, 0])
  return (
    <span className="num num-112">
      {score[0]} — {score[1]}
    </span>
  )
}

export function Groups() {
  const nav = useNavigate()
  const { user, groups, createGroup, joinByToken, signOut } = useSession()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [account, setAccount] = useState(false)
  const [name, setName] = useState('')
  const [sport, setSport] = useState<Sport>('volei')
  const [schedule, setSchedule] = useState('')
  const [token, setToken] = useState('')
  const [joinError, setJoinError] = useState(false)
  const [busy, setBusy] = useState(false)

  const userInitials = useMemo(() => initials(user?.name ?? 'V'), [user])

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    const g = await createGroup(name.trim(), sport, schedule.trim())
    setBusy(false)
    setCreating(false)
    nav(`/g/${g.id}`)
  }

  const join = async () => {
    const t = token.trim().split('/').pop() ?? ''
    if (!t) return
    setBusy(true)
    setJoinError(false)
    try {
      const groupId = await joinByToken(t)
      if (groupId) {
        setJoining(false)
        nav(`/g/${groupId}`)
      } else setJoinError(true)
    } catch {
      setJoinError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <div className="px-5 pt-[max(18px,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
        <h1 className="text-[27px] font-extrabold text-ink tracking-[-0.035em]">Meus grupos</h1>
        <button
          onClick={() => setAccount(true)}
          className="w-9 h-9 rounded-full bg-[#DDD8F5] text-accent-press text-[13px] font-bold flex items-center justify-center overflow-hidden"
          aria-label="Sua conta"
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            userInitials
          )}
        </button>
      </div>

      <Content className="flex flex-col gap-3 pb-4">
        {groups.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-[38px]">🏐</div>
            <div className="text-[16.5px] font-bold text-ink mt-2">Cria teu primeiro grupo</div>
            <div className="text-[13.5px] text-ter mt-1 leading-relaxed">
              O grupo é a tua turma — o vôlei de terça, o futsal do trampo. Jogadores, partidas e ranking ficam nele.
            </div>
          </Card>
        )}
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}

        <div className="flex flex-col gap-2.5 mt-2">
          <Button variant="black" size="md" onClick={() => setCreating(true)}>
            Criar grupo
          </Button>
          <Button variant="outline" size="md" onClick={() => setJoining(true)}>
            Entrar por link
          </Button>
        </div>

        <div className="text-[12.5px] text-ter text-center mt-6 mb-2">
          Feito com <span className="text-danger">❤️</span> por{' '}
          <a
            href="https://www.linkedin.com/in/dev-ferreira/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-accent underline decoration-accent/30 underline-offset-2"
          >
            Ferreira
          </a>
        </div>
      </Content>

      {/* criar grupo */}
      <Sheet open={creating} onClose={() => setCreating(false)}>
        <div className="px-5 pt-3">
          <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Novo grupo</div>
          <div className="text-[13px] text-ter mt-0.5 mb-4">A tua turma de sempre.</div>
          <AutoFocusInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do grupo (ex.: Vôlei de terça)"
            className="w-full h-[54px] rounded-[15px] border-[1.5px] border-accent bg-white px-4 text-[17px] text-ink outline-none placeholder:text-dis"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {SPORTS.map((s) => {
              const Icon = SPORT_ICONS[s.id]
              const active = sport === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSport(s.id)}
                  className={`h-10 px-3.5 rounded-full border text-[13.5px] font-semibold flex items-center gap-2 transition-colors ${
                    active ? 'bg-ink text-white border-ink' : 'bg-white text-sec border-knob2'
                  }`}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              )
            })}
          </div>
          <input
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="Quando rola? (ex.: terça 20h)"
            className="w-full h-[48px] rounded-[13px] bg-field px-4 text-[15px] text-ink outline-none placeholder:text-dis mt-3"
          />
          <div className="mt-4">
            <Button onClick={create} disabled={!name.trim() || busy}>
              Criar grupo
            </Button>
          </div>
        </div>
      </Sheet>

      {/* conta */}
      <Sheet open={account} onClose={() => setAccount(false)}>
        <div className="px-5 pt-3">
          <div className="flex items-center gap-3.5">
            <span className="w-14 h-14 rounded-full bg-[#DDD8F5] text-accent-press text-[19px] font-bold flex items-center justify-center flex-none overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                userInitials
              )}
            </span>
            <div className="min-w-0">
              <div className="text-[17px] font-bold text-ink truncate">{user?.name ?? 'Você'}</div>
              {user?.email && <div className="text-[13px] text-ter truncate">{user.email}</div>}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button variant="outline" size="md" onClick={() => setAccount(false)}>
              Continuar como {user?.name?.split(' ')[0] ?? 'você'}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="!text-danger !border-danger/40"
              onClick={() => void signOut().then(() => nav('/login', { replace: true }))}
            >
              Sair da conta
            </Button>
          </div>

          <div className="text-[11.5px] text-dis text-center mt-4">TemJogo · versão {__BUILD_TIME__}</div>
        </div>
      </Sheet>

      {/* entrar por link */}
      <Sheet open={joining} onClose={() => setJoining(false)}>
        <div className="px-5 pt-3">
          <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Entrar por link</div>
          <div className="text-[13px] text-ter mt-0.5 mb-4">Cola o link ou o código do convite.</div>
          <AutoFocusInput
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="racha.app/g/abc12 ou abc12"
            className="w-full h-[54px] rounded-[15px] border-[1.5px] border-accent bg-white px-4 text-[16px] text-ink outline-none placeholder:text-dis"
          />
          {joinError && <div className="text-danger text-[13px] mt-2">Convite não encontrado. Confere o código?</div>}
          <div className="mt-4">
            <Button onClick={join} disabled={!token.trim() || busy}>
              Entrar no grupo
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  )
}
