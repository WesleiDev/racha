import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, Dot, Sheet } from '../components/ui'
import { Avatar, Stars } from '../components/player'
import {
  IconDrag,
  IconMic,
  IconPencil,
  IconPin,
  IconPlay,
  IconSpeaker,
  IconShare,
  IconStop,
  IconSwap,
  IconUndo,
  IconX,
} from '../components/icons'
import { useRoster } from '../state/roster'
import { useSetup } from '../state/setup'
import { useSession, isAdmin } from '../state/session'
import { useLive } from '../state/live'
import type { Player, Team, TeamSound } from '../data/types'
import { teamColor, TEAM_COLORS } from '../lib/colors'
import { balance } from '../lib/draw'
import { newId } from '../lib/id'
import { buildMatch } from '../lib/match'
import { db } from '../data'
import { fmtStars } from '../lib/format'
import { MicPermissionError, playLibrary, playRecorded, recordClip, SOUND_LIBRARY, ensureCtx } from '../lib/audio'

/* ---------------------------------------------------------------- */

function PlayerRow({ player, admin, pinned, onPin }: { player: Player; admin: boolean; pinned: boolean; onPin: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id })
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2.5 py-[7px] px-1 rounded-[10px] ${isDragging ? 'opacity-30' : ''}`}
    >
      <span {...attributes} {...listeners} className="touch-none cursor-grab text-knob px-0.5 -ml-0.5">
        <IconDrag size={15} color="#C9C6D2" />
      </span>
      <Avatar name={player.name} color={player.color} size={26} />
      <span className="flex-1 text-[14.5px] font-medium text-ink truncate">{player.name}</span>
      {admin && <Stars value={player.stars} size={11.5} />}
      <button onClick={onPin} className="w-7 h-7 flex items-center justify-center" aria-label="Fixar no time">
        <IconPin size={15} filled={pinned} color={pinned ? '#15141A' : '#DFDCD4'} />
      </button>
    </div>
  )
}

function TeamCard({
  team,
  index,
  players,
  admin,
  onSoundTap,
}: {
  team: Team
  index: number
  players: Player[]
  admin: boolean
  onSoundTap: () => void
}) {
  const { renameTeam, setTeamColor, togglePin, teams } = useSetup()
  const { setNodeRef, isOver } = useDroppable({ id: `team-${index}` })
  const [editing, setEditing] = useState(false)
  const color = teamColor(team.colorId)
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])
  const stars = team.playerIds.reduce((s, id) => s + (byId.get(id)?.stars ?? 0), 0)

  const cycleColor = () => {
    const used = new Set(teams.filter((_, i) => i !== index).map((t) => t.colorId))
    const start = TEAM_COLORS.findIndex((c) => c.id === team.colorId)
    for (let k = 1; k <= TEAM_COLORS.length; k++) {
      const next = TEAM_COLORS[(start + k) % TEAM_COLORS.length]
      if (!used.has(next.id)) {
        setTeamColor(index, next.id)
        return
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-card border rounded-[20px] overflow-hidden transition-colors ${
        isOver ? 'border-accent' : 'border-cardline'
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: color.tint }}>
        <button onClick={cycleColor} aria-label="Trocar cor do time">
          <Dot color={color.hex} size={22} />
        </button>
        {editing ? (
          <input
            autoFocus
            defaultValue={team.name}
            onBlur={(e) => {
              renameTeam(index, e.target.value.trim() || team.name)
              setEditing(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 bg-transparent outline-none text-[17px] font-bold text-ink min-w-0"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
            <span className="text-[17px] font-bold text-ink tracking-[-0.02em] truncate">{team.name}</span>
            <IconPencil size={13} color="#6E6B7B" />
          </button>
        )}
        {admin && (
          <span className="num num-112 text-[13px] font-bold text-sec flex items-center gap-1">
            {fmtStars(stars)} <span className="text-gold">★</span>
          </span>
        )}
      </div>

      <div className="px-3 py-1.5">
        {team.playerIds.map((id) => {
          const p = byId.get(id)
          if (!p) return null
          return (
            <PlayerRow key={id} player={p} admin={admin} pinned={team.pinned.includes(id)} onPin={() => togglePin(id)} />
          )
        })}
        {team.playerIds.length === 0 && (
          <div className="text-[12.5px] text-dis text-center py-3">arrasta alguém pra cá</div>
        )}
      </div>

      {/* som do time */}
      <button onClick={onSoundTap} className="w-full bg-dark mx-0 px-4 py-3 flex items-center gap-3 text-left">
        <span
          style={{ background: color.hex }}
          className="w-[30px] h-[30px] rounded-full flex-none flex items-center justify-center text-white"
        >
          <IconSpeaker size={15} color="#fff" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13.5px] font-semibold text-white truncate">{team.sound.name}</span>
          <span className="block text-[11px] text-ondark-ter">toca a cada ponto</span>
        </span>
        <span className="flex items-end gap-[2.5px] h-4" aria-hidden>
          {[7, 12, 9, 15, 11, 8, 13].map((h, i) => (
            <span key={i} style={{ height: h, background: color.hex, width: 2.5 }} className="rounded-full inline-block" />
          ))}
        </span>
        <span className="text-[11.5px] font-bold text-white bg-white/12 rounded-full px-2.5 py-1">trocar</span>
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------- */

type RecState =
  | { phase: 'idle' }
  | { phase: 'prep'; n: number }
  | { phase: 'recording'; remaining: number }
  | { phase: 'preview'; dataUrl: string }
  | { phase: 'denied' }

function SoundSheet({ teamIndex, onClose, admin }: { teamIndex: number | null; onClose: () => void; admin: boolean }) {
  const { teams, setTeamSound } = useSetup()
  const { sounds, addSound, removeSound } = useRoster()
  const [rec, setRec] = useState<RecState>({ phase: 'idle' })
  const [saving, setSaving] = useState(false)
  const recorder = useRef<{ stop: () => void } | null>(null)
  const team = teamIndex !== null ? teams[teamIndex] : null

  useEffect(() => {
    if (teamIndex === null) setRec({ phase: 'idle' })
  }, [teamIndex])

  if (teamIndex === null || !team) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const color = teamColor(team.colorId)

  const pick = (sound: TeamSound) => {
    setTeamSound(teamIndex, sound)
    onClose()
  }

  /** guarda a gravação no grupo (fica salva pras próximas partidas) e usa nela */
  const keepRecording = async (dataUrl: string) => {
    setSaving(true)
    const n = sounds.length + 1
    const saved = { id: newId(), name: `Grito da galera ${n}`, dataUrl, createdAt: Date.now() }
    try {
      await addSound(saved)
    } catch {
      /* sem rede: segue com o som na partida atual mesmo */
    }
    setSaving(false)
    pick({ kind: 'recorded', dataUrl, name: saved.name })
  }

  const startRecording = async () => {
    ensureCtx()
    setRec({ phase: 'prep', n: 3 })
    for (let n = 3; n >= 1; n--) {
      setRec({ phase: 'prep', n })
      await new Promise((r) => setTimeout(r, 700))
    }
    try {
      const r = await recordClip(3, (remaining) => setRec({ phase: 'recording', remaining }))
      recorder.current = r
      const dataUrl = await r.done
      setRec({ phase: 'preview', dataUrl })
    } catch (e) {
      setRec(e instanceof MicPermissionError ? { phase: 'denied' } : { phase: 'idle' })
    }
  }

  return (
    <Sheet open onClose={onClose}>
      <div className="px-5 pt-3 pb-2">
        <div className="text-[19px] font-extrabold text-ink tracking-[-0.02em]">Som do {team.name}</div>
        <div className="text-[13px] text-ter mt-0.5 mb-4">3 segundos. Toca a cada ponto.</div>

        {/* gravação */}
        <div className="bg-dark rounded-[18px] p-4 flex items-center gap-4">
          {rec.phase === 'idle' && (
            <>
              <button
                onClick={() => void startRecording()}
                className="w-[52px] h-[52px] rounded-full flex-none flex items-center justify-center"
                style={{ background: 'linear-gradient(150deg, #F2352C, #FF4D96)' }}
                aria-label="Gravar"
              >
                <IconMic size={22} color="#fff" />
              </button>
              <div>
                <div className="text-[14.5px] font-semibold text-white">Gravar o grito do time</div>
                <div className="text-[12px] text-ondark-ter">grita aí: 3… 2… 1…</div>
              </div>
            </>
          )}
          {rec.phase === 'prep' && (
            <div className="flex items-center gap-4">
              <span className="num num-125 text-[40px] font-black text-lime w-[52px] text-center">{rec.n}</span>
              <div className="text-[14.5px] font-semibold text-white">Prepara o grito…</div>
            </div>
          )}
          {rec.phase === 'recording' && (
            <>
              <button
                onClick={() => recorder.current?.stop()}
                className="w-[52px] h-[52px] rounded-full flex-none flex items-center justify-center bg-danger animate-racha-pulse"
                aria-label="Parar"
              >
                <IconStop size={18} color="#fff" />
              </button>
              <div>
                <div className="text-[14.5px] font-semibold text-white">Gravando… {rec.remaining}s</div>
                <div className="text-[12px] t ext-ondark-ter text-ondark-ter">solta a voz!</div>
              </div>
            </>
          )}
          {rec.phase === 'preview' && (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => void playRecorded(rec.dataUrl)}
                className="w-[44px] h-[44px] rounded-full flex-none flex items-center justify-center bg-white/12"
                aria-label="Ouvir"
              >
                <IconPlay size={17} color="#fff" />
              </button>
              <span className="flex-1 text-[13.5px] font-semibold text-white">Ficou bom?</span>
              <button
                onClick={() => void startRecording()}
                className="text-[12px] font-bold text-white bg-white/12 rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <IconUndo size={12} color="#fff" /> de novo
              </button>
              <button
                onClick={() => void keepRecording(rec.dataUrl)}
                disabled={saving}
                className="text-[12px] font-bold text-ink bg-lime rounded-full px-3 py-1.5 disabled:opacity-60"
              >
                {saving ? 'salvando…' : 'Salvar e usar'}
              </button>
            </div>
          )}
          {rec.phase === 'denied' && (
            <div className="text-[13px] text-ondark leading-relaxed">
              Sem acesso ao microfone. Libera nas permissões do navegador ou escolhe um som pronto aí embaixo.
            </div>
          )}
        </div>

        {/* gravações do grupo — ficam salvas pras próximas partidas */}
        {sounds.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ter mb-1">Gravados pelo grupo</div>
            <div className="flex flex-col">
              {sounds.map((s, i) => {
                const selected = team.sound.kind === 'recorded' && team.sound.dataUrl === s.dataUrl
                return (
                  <div key={s.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-field' : ''}`}>
                    <button
                      onClick={() => void playRecorded(s.dataUrl)}
                      className="w-[26px] h-[26px] rounded-full border border-strong flex items-center justify-center text-ink active:bg-field flex-none"
                      aria-label={`Ouvir ${s.name}`}
                    >
                      <IconPlay size={11} />
                    </button>
                    <button
                      onClick={() => pick({ kind: 'recorded', dataUrl: s.dataUrl, name: s.name })}
                      className="flex-1 text-left"
                    >
                      <span className={`text-[14.5px] font-medium ${selected ? 'text-accent-press' : 'text-ink'}`}>
                        {s.name}
                      </span>
                    </button>
                    {selected && <Dot color={color.hex} size={8} />}
                    {admin && (
                      <button
                        onClick={() => void removeSound(s.id)}
                        className="w-7 h-7 flex items-center justify-center text-dis active:text-danger"
                        aria-label={`Apagar ${s.name}`}
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* biblioteca */}
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ter mb-1">Prontos</div>
          <div className="flex flex-col">
          {SOUND_LIBRARY.map((s, i) => {
            const selected = team.sound.kind === 'library' && team.sound.libraryId === s.id
            return (
              <div key={s.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-field' : ''}`}>
                <button
                  onClick={() => void playLibrary(s.id)}
                  className="w-[26px] h-[26px] rounded-full border border-strong flex items-center justify-center text-ink active:bg-field"
                  aria-label={`Ouvir ${s.name}`}
                >
                  <IconPlay size={11} />
                </button>
                <button onClick={() => pick({ kind: 'library', libraryId: s.id, name: s.name })} className="flex-1 text-left">
                  <span className={`text-[14.5px] font-medium ${selected ? 'text-accent-press' : 'text-ink'}`}>{s.name}</span>
                  <span className="text-[11px] text-dis font-semibold uppercase tracking-wide ml-2">{s.tag}</span>
                </button>
                {selected && <Dot color={color.hex} size={8} />}
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

/* ---------------------------------------------------------------- */

export function Draw() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { players, load, groupId: loaded, saveMatch, matches, deleteMatch } = useRoster()
  const { user, groups } = useSession()
  const admin = isAdmin(groups.find((g) => g.id === groupId), user)
  const { config, presentIds, teams, bench, draw, redraw, movePlayer, reset } = useSetup()
  const startMatch = useLive((s) => s.start)
  const [soundFor, setSoundFor] = useState<number | null>(null)
  const [dragging, setDragging] = useState<Player | null>(null)
  const [stuck, setStuck] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
  )

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const present = useMemo(() => players.filter((p) => presentIds.includes(p.id)), [players, presentIds])
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players])

  const needsDraw = teams.length === 0 || teams.every((t) => t.playerIds.length === 0)
  useEffect(() => {
    if (needsDraw && present.length >= 2) draw(players)
  }, [needsDraw, present.length, draw, players])

  const bal = teams.length > 0 ? balance(teams.map((t) => t.playerIds), present) : null
  const balText =
    bal &&
    (bal.level === 'otimo' ? 'Equilíbrio ótimo' : bal.level === 'bom' ? 'Equilíbrio bom' : 'Tá torto — arrasta alguém')

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const playerId = String(e.active.id)
    const over = e.over?.id
    if (!over) return
    if (over === 'bench') movePlayer(playerId, 'bench')
    else if (String(over).startsWith('team-')) movePlayer(playerId, Number(String(over).slice(5)))
  }

  const againstRepeat = () => {
    const changed = redraw(players)
    setStuck(!changed)
    if (!changed) setTimeout(() => setStuck(false), 5000)
  }

  const begin = () => {
    ensureCtx() // gesto do usuário → áudio liberado
    const group = groups.find((g) => g.id === groupId)
    startMatch(groupId, group?.name ?? 'TemJogo', config, teams, bench, players)
    nav(`/g/${groupId}/placar`)
  }

  /** guarda a escalação sem começar o jogo — dá pra mandar no grupo e jogar depois */
  const saveLineup = async () => {
    const group = groups.find((g) => g.id === groupId)
    const present = players.filter((p) => presentIds.includes(p.id))
    const lineup = buildMatch(groupId, group?.name ?? 'TemJogo', config, teams, bench, present, 'scheduled')
    // só faz sentido ter uma escalação esperando: a nova substitui a anterior
    for (const old of matches.filter((m) => m.status === 'scheduled')) {
      await deleteMatch(old.id).catch(() => {})
      void db.clearLive(old.liveToken).catch(() => {})
    }
    await saveMatch(lineup)
    void db.publishLive(lineup).catch(() => {})
    reset()
    nav(`/g/${groupId}/escalacao/${lineup.id}`, { replace: true })
  }

  return (
    <Screen>
      <Header back title="Times sorteados" sub="Arrasta pra trocar de lado" />
      <Content className="flex flex-col gap-3 pb-4">
        {admin && bal && (
          <div className="bg-success-soft text-success-ink rounded-[13px] px-3.5 py-2.5 text-[13px] font-semibold flex items-center justify-between">
            <span>
              {balText} · {bal.sums.map((s) => fmtStars(s)).join(' ★ contra ')} ★
            </span>
            <span className="text-[11px] font-bold opacity-70">só admin vê</span>
          </div>
        )}

        <DndContext
          sensors={sensors}
          onDragStart={(e) => setDragging(byId.get(String(e.active.id)) ?? null)}
          onDragEnd={onDragEnd}
        >
          <div className="flex flex-col gap-3">
            {teams.map((t, i) => (
              <TeamCard key={i} team={t} index={i} players={present} admin={admin} onSoundTap={() => setSoundFor(i)} />
            ))}
          </div>

          <BenchZone bench={bench} byId={byId} />

          <DragOverlay>
            {dragging && (
              <div className="flex items-center gap-2.5 bg-white rounded-[12px] px-3 py-2 shadow-lg border border-accent-line">
                <Avatar name={dragging.name} color={dragging.color} size={26} />
                <span className="text-[14.5px] font-medium text-ink">{dragging.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </Content>

      <BottomBar>
        {stuck && (
          <div className="bg-notice text-notice-ink text-[12px] font-medium rounded-[10px] px-3 py-2 mb-2 text-center leading-snug">
            Deu nos mesmos times — solta os pinos (ou chama mais gente) pra variar.
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={againstRepeat}
              className="flex-1 h-[46px] rounded-[13px] border border-strong text-ink text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:bg-field"
            >
              <IconSwap size={15} /> Sortear de novo
            </button>
            <button
              onClick={() => void saveLineup()}
              disabled={teams.length < 2}
              className="flex-1 h-[46px] rounded-[13px] border border-strong text-ink text-[13.5px] font-bold flex items-center justify-center gap-1.5 active:bg-field disabled:opacity-40"
            >
              <IconShare size={14} /> Salvar pra depois
            </button>
          </div>
          <Button variant="black" onClick={begin} disabled={teams.length < 2}>
            Começar partida agora
          </Button>
        </div>
      </BottomBar>

      <SoundSheet teamIndex={soundFor} onClose={() => setSoundFor(null)} admin={admin} />
    </Screen>
  )
}

function BenchZone({ bench, byId }: { bench: string[]; byId: Map<string, Player> }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench' })
  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed rounded-[16px] px-4 py-3 mt-1 transition-colors ${
        isOver ? 'border-accent bg-accent-soft' : 'border-strong'
      }`}
    >
      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-ter">Banco · quem ganha fica</div>
      <div className="flex gap-2 flex-wrap mt-2 min-h-[30px]">
        {bench.length === 0 && <span className="text-[12.5px] text-dis py-1">ninguém no banco</span>}
        {bench.map((id) => {
          const p = byId.get(id)
          if (!p) return null
          return <BenchChip key={id} player={p} />
        })}
      </div>
    </div>
  )
}

function BenchChip({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id })
  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none cursor-grab bg-white border border-cardline rounded-full pl-1 pr-3 py-1 flex items-center gap-2 text-[13px] font-medium text-ink ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <Avatar name={player.name} color={player.color} size={22} />
      {player.name}
    </span>
  )
}
