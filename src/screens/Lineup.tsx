import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, Card, Dot, LiveDot, Modal, SectionLabel, Sheet } from '../components/ui'
import { Avatar } from '../components/player'
import { IconCopy, IconPlay, IconShare, IconX } from '../components/icons'
import { useRoster } from '../state/roster'
import { useLive } from '../state/live'
import { db } from '../data'
import type { Match } from '../data/types'
import { teamColor } from '../lib/colors'
import { shareLineup, buildManualGame } from '../lib/match'
import { sportLabel } from '../data/types'
import { fmtDayTime } from '../lib/format'
import { ensureCtx } from '../lib/audio'
import { boardOf, allSets, usesSets } from '../lib/scoring'
import { matchWinner } from '../lib/rank'
import { track } from '../lib/analytics'

/** anotar o placar final de um jogo que rolou sem ninguém marcando */
function ManualResult({
  session,
  onSave,
  onCancel,
}: {
  session: Match
  onSave: (teamIdx: [number, number], sets: number[][]) => void | Promise<void>
  onCancel: () => void
}) {
  const pairs = session.teams.flatMap((a, i) =>
    session.teams.slice(i + 1).map((b, k) => ({ i, j: i + 1 + k, a, b })),
  )
  const [pair, setPair] = useState(0)
  const porSets = usesSets(session.config)
  const [sets, setSets] = useState<string[][]>([['', '']])
  const [busy, setBusy] = useState(false)

  const chosen = pairs[pair]
  const parsed = sets
    .map((s) => [Number(s[0]), Number(s[1])])
    .filter((s) => s.every((n) => Number.isFinite(n)) && (s[0] > 0 || s[1] > 0))
  const valido = parsed.length > 0

  const setValue = (row: number, col: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 2)
    setSets((prev) => prev.map((s, r) => (r === row ? (col === 0 ? [clean, s[1]] : [s[0], clean]) : s)))
  }

  const input =
    'w-full h-[52px] rounded-[13px] border border-strong bg-white text-center num num-118 text-[22px] font-extrabold text-ink outline-none focus:border-accent'

  return (
    <div className="px-5 pt-3 pb-2">
      <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Anotar resultado</div>
      <div className="text-[13px] text-ter mt-0.5 mb-4">Jogo que rolou sem ninguém marcando o placar.</div>

      {pairs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
          {pairs.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPair(idx)}
              className={`flex-none rounded-full px-3.5 h-9 text-[13px] font-bold border flex items-center gap-1.5 ${
                idx === pair ? 'bg-ink text-white border-ink' : 'bg-white text-sec border-knob2'
              }`}
            >
              <Dot color={teamColor(p.a.colorId).hex} size={7} />
              {p.a.name.replace(/^Time /, '')} × {p.b.name.replace(/^Time /, '')}
              <Dot color={teamColor(p.b.colorId).hex} size={7} />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[13.5px] font-bold text-ink mb-2">
        <span className="flex items-center gap-1.5">
          <Dot color={teamColor(chosen.a.colorId).hex} size={9} />
          {chosen.a.name.replace(/^Time /, '')}
        </span>
        <span className="flex items-center gap-1.5">
          {chosen.b.name.replace(/^Time /, '')}
          <Dot color={teamColor(chosen.b.colorId).hex} size={9} />
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sets.map((s, row) => (
          <div key={row} className="flex items-center gap-2.5">
            {porSets && <span className="text-[11px] font-bold text-ter w-10">SET {row + 1}</span>}
            <input
              value={s[0]}
              onChange={(e) => setValue(row, 0, e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className={input}
            />
            <span className="text-dis text-[15px]">×</span>
            <input
              value={s[1]}
              onChange={(e) => setValue(row, 1, e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className={input}
            />
            {sets.length > 1 && (
              <button
                onClick={() => setSets((prev) => prev.filter((_, r) => r !== row))}
                className="w-7 h-7 flex items-center justify-center text-dis"
                aria-label="Remover set"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {porSets && sets.length < session.config.bestOf && (
        <button
          onClick={() => setSets((prev) => [...prev, ['', '']])}
          className="mt-2.5 h-10 w-full rounded-[12px] border border-dashed border-strong text-[13px] font-bold text-sec active:bg-field"
        >
          + Adicionar set
        </button>
      )}

      <div className="flex gap-2.5 mt-4">
        <button onClick={onCancel} className="flex-1 h-[50px] rounded-[14px] bg-field text-ink text-[14.5px] font-bold">
          Cancelar
        </button>
        <button
          disabled={!valido || busy}
          onClick={async () => {
            setBusy(true)
            await onSave([chosen.i, chosen.j], parsed)
            setBusy(false)
          }}
          className="flex-1 h-[50px] rounded-[14px] bg-ink text-white text-[14.5px] font-bold disabled:opacity-40"
        >
          Salvar resultado
        </button>
      </div>
    </div>
  )
}

/** placar resumido de um jogo da rodada */
function GameRow({ game, onOpen }: { game: Match; onOpen: () => void }) {
  const board = boardOf(game)
  const live = game.status === 'live'
  // jogo rolando: mostra o set atual (sets ganhos ainda são 0-0 no primeiro set)
  const score = live ? board.current : usesSets(game.config) ? board.setsWon : allSets(board).at(-1) ?? [0, 0]
  const setsBadge = live && board.closedSets.length > 0 ? board.setsWon.join('–') : null
  const winner = game.status === 'finished' ? matchWinner(game) : null

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left rounded-[14px] border px-3.5 py-3 flex items-center gap-3 ${
        live ? 'border-danger/40 bg-danger/[0.04]' : 'border-cardline bg-card'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
          <Dot color={teamColor(game.teams[0].colorId).hex} size={7} />
          <span className={winner === 1 ? 'text-ter' : ''}>{game.teams[0].name.replace(/^Time /, '')}</span>
          <span className="text-dis">×</span>
          <span className={winner === 0 ? 'text-ter' : ''}>{game.teams[1]?.name.replace(/^Time /, '')}</span>
          <Dot color={teamColor(game.teams[1]?.colorId ?? 'laranja').hex} size={7} />
        </div>
        <div className="text-[11.5px] text-ter mt-0.5 flex items-center gap-1.5">
          {live ? (
            <>
              <LiveDot color="#F2352C" />
              rolando agora
              {setsBadge && <span className="text-dis">· sets {setsBadge}</span>}
            </>
          ) : (
            `encerrado · ${fmtDayTime(game.finishedAt ?? game.startedAt)}`
          )}
        </div>
      </div>
      <span className="num num-118 text-[19px] font-extrabold text-ink flex-none">
        {score[0]}–{score[1]}
      </span>
    </button>
  )
}

export function Lineup() {
  const { groupId = '', matchId = '' } = useParams()
  const nav = useNavigate()
  const { matches, load, groupId: loaded, deleteMatch, saveMatch } = useRoster()
  const startGame = useLive((s) => s.startGame)
  const liveMatch = useLive((s) => s.match)
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmDrop, setConfirmDrop] = useState(false)
  const [picking, setPicking] = useState(false)
  const [noting, setNoting] = useState(false)
  const [games, setGames] = useState<Match[]>([])

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  // jogos da rodada em tempo real: quem está na quadra 1 vê o placar da quadra 2
  useEffect(() => {
    if (!groupId || !matchId) return
    return db.watchSessionMatches(groupId, matchId, setGames)
  }, [groupId, matchId])

  const session = matches.find((m) => m.id === matchId)

  const lastWinnerTeam = useMemo(() => {
    const finished = games.filter((g) => g.status === 'finished')
    const last = finished[finished.length - 1]
    if (!last) return null
    const w = matchWinner(last)
    return w === null ? null : last.teams[w]?.name ?? null
  }, [games])

  if (!session) {
    return (
      <Screen>
        <Header back={`/g/${groupId}`} title="Rodada" />
        <Content>
          <div className="text-[14px] text-ter text-center py-16">Rodada não encontrada.</div>
        </Content>
      </Screen>
    )
  }

  const url = `${location.origin}/ao-vivo/${session.liveToken}`
  const multi = session.teams.length > 2

  const share = async () => {
    const r = await shareLineup(session, url)
    track('compartilhou_times', { como: r, times: session.teams.length })
    if (r === 'copied') setMsg('Copiado! É só colar no grupo.')
    if (r === 'failed') setMsg('Não rolou copiar — o link tá logo abaixo.')
    if (r !== 'shared') setTimeout(() => setMsg(null), 4000)
  }

  const play = (i: number, j: number) => {
    ensureCtx()
    const game = startGame(session, [i, j])
    void saveMatch(game).catch((e) => console.error('[salvar partida]', e))
    setPicking(false)
    nav(`/g/${groupId}/placar`, { replace: true })
  }

  const drop = async () => {
    await deleteMatch(session.id)
    void db.clearLive(session.liveToken).catch(() => {})
    nav(`/g/${groupId}`, { replace: true })
  }

  const hasLiveHere = liveMatch?.status === 'live' && liveMatch.sessionId === session.id

  return (
    <Screen>
      <Header
        back={`/g/${groupId}`}
        title={multi ? 'Rodada' : 'Times sorteados'}
        sub={`${session.teams.length} times · ${sportLabel(session.config.sport).toLowerCase()} · ${fmtDayTime(session.startedAt)}`}
      />
      <Content className="flex flex-col gap-3 pb-4">
        {/* jogos */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Jogos da rodada</SectionLabel>
            {games.length > 0 && <span className="text-[12px] text-ter">{games.length}</span>}
          </div>
          {games.length === 0 ? (
            <div className="text-[13px] text-ter mt-2 leading-relaxed">
              Nenhum jogo ainda.{' '}
              {multi
                ? 'Escolhe quem entra em quadra — dá pra rodar duas quadras em celulares diferentes.'
                : 'É só começar quando a bola subir.'}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2.5">
              {games.map((g) => (
                <GameRow
                  key={g.id}
                  game={g}
                  onOpen={() =>
                    g.status === 'live' && liveMatch?.id === g.id
                      ? nav(`/g/${groupId}/placar`)
                      : nav(`/g/${groupId}/partida/${g.id}`)
                  }
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setNoting(true)}
            className="mt-3 h-10 w-full rounded-[12px] border border-dashed border-strong text-[13px] font-bold text-sec active:bg-field"
          >
            + Anotar resultado (jogo sem placar)
          </button>
        </Card>

        {/* times sorteados */}
        {session.teams.map((team, i) => {
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
                      name={session.players[pid]?.name ?? '?'}
                      color={session.players[pid]?.color ?? '#9A97A5'}
                      size={26}
                    />
                    {session.players[pid]?.name ?? '?'}
                  </span>
                ))}
              </div>
            </Card>
          )
        })}

        {session.bench.length > 0 && (
          <div className="border border-dashed border-strong rounded-[16px] px-4 py-3">
            <SectionLabel>Banco · quem ganha fica</SectionLabel>
            <div className="flex gap-2 flex-wrap mt-2">
              {session.bench.map((pid) => (
                <span
                  key={pid}
                  className="bg-white border border-cardline rounded-full pl-1 pr-3 py-1 flex items-center gap-2 text-[13px] text-ink"
                >
                  <Avatar
                    name={session.players[pid]?.name ?? '?'}
                    color={session.players[pid]?.color ?? '#9A97A5'}
                    size={22}
                  />
                  {session.players[pid]?.name ?? '?'}
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
            Mostra os times sorteados. Cada jogo tem o próprio link de placar ao vivo.
          </div>
        </Card>

        <button
          onClick={() => setConfirmDrop(true)}
          className="text-[13px] font-semibold text-danger py-2 flex items-center justify-center gap-1.5"
        >
          <IconX size={14} /> Encerrar rodada
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
          {hasLiveHere ? (
            <Button variant="black" onClick={() => nav(`/g/${groupId}/placar`)}>
              Voltar pro jogo em andamento
            </Button>
          ) : (
            <Button variant="black" onClick={() => (multi ? setPicking(true) : play(0, 1))}>
              {games.length > 0 ? 'Começar outro jogo' : 'Começar partida'}
            </Button>
          )}
        </div>
      </BottomBar>

      {/* anotar resultado sem placar ao vivo */}
      <Sheet open={noting} onClose={() => setNoting(false)}>
        <ManualResult
          session={session}
          onCancel={() => setNoting(false)}
          onSave={async (idx, sets) => {
            const game = buildManualGame(session, idx, sets)
            try {
              await saveMatch(game)
              track('resultado_anotado', { sets: sets.length, esporte: session.config.sport })
              setNoting(false)
              setMsg('Resultado anotado!')
            } catch (e) {
              console.error('[anotar resultado]', e)
              await deleteMatch(game.id).catch(() => {})
              setNoting(false)
              setMsg('Não deu pra salvar. Confere a internet e tenta de novo.')
            }
            setTimeout(() => setMsg(null), 4000)
          }}
        />
      </Sheet>

      {/* quem entra em quadra */}
      <Sheet open={picking} onClose={() => setPicking(false)}>
        <div className="px-5 pt-3 pb-2">
          <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Quem entra em quadra?</div>
          <div className="text-[13px] text-ter mt-0.5 mb-4">
            {lastWinnerTeam ? `${lastWinnerTeam} venceu o último — quem ganha fica.` : 'Escolhe o confronto desta quadra.'}
          </div>
          <div className="flex flex-col gap-2">
            {session.teams.flatMap((a, i) =>
              session.teams.slice(i + 1).map((b, k) => {
                const j = i + 1 + k
                const jaJogou = games.some(
                  (g) =>
                    g.teams.length === 2 &&
                    [g.teams[0].name, g.teams[1].name].sort().join('|') === [a.name, b.name].sort().join('|'),
                )
                const emQuadra = games.some(
                  (g) =>
                    g.status === 'live' &&
                    [g.teams[0].name, g.teams[1]?.name].sort().join('|') === [a.name, b.name].sort().join('|'),
                )
                return (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => play(i, j)}
                    className="flex items-center gap-3 rounded-[14px] border border-cardline bg-card px-4 py-3 text-left active:border-accent"
                  >
                    <Dot color={teamColor(a.colorId).hex} size={12} />
                    <span className="text-[15px] font-bold text-ink">{a.name.replace(/^Time /, '')}</span>
                    <span className="text-dis text-[13px]">×</span>
                    <span className="text-[15px] font-bold text-ink flex-1">{b.name.replace(/^Time /, '')}</span>
                    <Dot color={teamColor(b.colorId).hex} size={12} />
                    {emQuadra ? (
                      <span className="text-[10.5px] font-extrabold text-danger bg-danger/10 rounded-full px-2 py-1">
                        NA QUADRA
                      </span>
                    ) : jaJogou ? (
                      <span className="text-[10.5px] font-bold text-ter bg-field rounded-full px-2 py-1">já jogou</span>
                    ) : null}
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </Sheet>

      <Modal open={confirmDrop}>
        <div className="text-center">
          <div className="text-[17px] font-extrabold text-ink">Encerrar a rodada?</div>
          <div className="text-[13px] text-ter mt-1.5">
            Os jogos já registrados continuam no histórico. Só os times sorteados saem da tela.
          </div>
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
              Encerrar
            </button>
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
