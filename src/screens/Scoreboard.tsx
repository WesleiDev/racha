import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BoardHalves, SetPill } from '../components/board'
import { Modal, LiveDot } from '../components/ui'
import { IconStop, IconSwap, IconUndo } from '../components/icons'
import { useLive, useBoard } from '../state/live'
import { useRoster } from '../state/roster'
import { useWakeLock, useOnline, enterFullscreen, exitFullscreen } from '../lib/device'
import { preloadMatchSounds, playVictory } from '../lib/audio'
import { teamColor } from '../lib/colors'
import { fmtClock } from '../lib/format'
import { computeBoard, leaderNow } from '../lib/scoring'

export function Scoreboard() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { match, point, undo, removeLastPointOf, closeSet, flipSides, finish, toggleClock, elapsedMs, runningSince } =
    useLive()
  const board = useBoard()
  const saveMatch = useRoster((s) => s.saveMatch)
  const online = useOnline()

  const [pulse, setPulse] = useState<{ team: number; key: number } | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [now, setNow] = useState(Date.now())
  const lastTap = useRef(0)
  const timeAlerted = useRef(false)

  useWakeLock(true)

  useEffect(() => {
    void enterFullscreen()
    return () => void exitFullscreen()
  }, [])

  useEffect(() => {
    if (match) void preloadMatchSounds(match.teams)
  }, [match?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  // partida decidida → som de vitória e resumo
  const finished = board?.finished ?? false
  useEffect(() => {
    if (!finished || !match) return
    void playVictory()
    const t = setTimeout(() => {
      const done = finish()
      if (done) void saveMatch(done).catch((e) => console.error('[salvar partida]', e))
      nav(`/g/${groupId}/resumo/${match.id}`, { replace: true })
    }, 900)
    return () => clearTimeout(t)
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!match || !board) {
    return (
      <FullscreenBg>
        <div className="text-ondark text-[15px]">Nenhuma partida rolando.</div>
        <button onClick={() => nav(`/g/${groupId}`)} className="text-lime text-[14px] font-bold mt-2">
          voltar pro grupo
        </button>
      </FullscreenBg>
    )
  }

  const isTempo = match.config.scoring === 'tempo'
  const elapsed = elapsedMs + (runningSince ? now - runningSince : 0)
  const clockSec = isTempo
    ? Math.max(0, match.config.timeMinutes * 60 - elapsed / 1000)
    : (now - match.startedAt) / 1000

  // tempo esgotado → abre confirmação de encerrar (uma vez)
  if (isTempo && clockSec <= 0 && !timeAlerted.current) {
    timeAlerted.current = true
    setTimeout(() => setConfirmEnd(true), 0)
  }

  const tap = (team: number) => {
    const t = Date.now()
    if (t - lastTap.current < 300) return // toque duplo acidental
    lastTap.current = t
    if (board.pendingSetWin !== null || board.finished) return
    point(team)
    setPulse({ team, key: t })
  }

  const endMatch = () => {
    const done = finish()
    if (done) void saveMatch(done).catch((e) => console.error('[salvar partida]', e))
    nav(`/g/${groupId}/resumo/${match.id}`, { replace: true })
  }

  const pending = board.pendingSetWin
  const pendingBoard = pending !== null ? board : null
  const lastSetOfMatch =
    match.config.scoring === 'sets' &&
    pending !== null &&
    board.setsWon[pending] + 1 >= Math.ceil(match.config.bestOf / 2)

  return (
    <FullscreenBg>
      <BoardHalves match={match} board={board} onTap={tap} pulse={pulse} />

      {/* topo */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-[max(10px,env(safe-area-inset-top))] pointer-events-none">
        <div className="flex items-center gap-2 w-[130px]">
          {!online && (
            <>
              <LiveDot />
              <span className="text-ondark-ter text-[10.5px] font-semibold leading-tight">
                sem internet · salvando no aparelho
              </span>
            </>
          )}
        </div>
        <SetPill match={match} board={board} />
        <button
          onClick={isTempo ? toggleClock : undefined}
          className={`num num-118 text-[15px] font-bold w-[130px] text-right pointer-events-auto ${
            isTempo && !runningSince ? 'text-lime' : 'text-ondark-ter'
          }`}
        >
          {fmtClock(clockSec)}
          {isTempo && !runningSince && <span className="text-[9px] tracking-[0.12em] ml-1.5">PAUSADO</span>}
        </button>
      </div>

      {/* barra de controles */}
      <div className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex items-center gap-[7px] bg-white/7 backdrop-blur-[9px] rounded-full p-[7px]">
        <button
          onClick={undo}
          className="w-[38px] h-[38px] rounded-full bg-white text-ink flex items-center justify-center active:bg-lime transition-colors"
          style={{ opacity: match.events.length === 0 ? 0.45 : 1 }}
          aria-label="Desfazer"
        >
          <IconUndo size={17} />
        </button>
        {match.teams.slice(0, 2).map((team, t) => (
          <button
            key={t}
            onClick={() => removeLastPointOf(t)}
            className="h-[38px] px-3 rounded-full bg-white/10 text-white active:bg-white/20 flex flex-col items-center justify-center leading-none"
          >
            <span className="text-[12px] font-bold">−1</span>
            <span className="text-[9px] font-semibold mt-0.5" style={{ color: teamColor(team.colorId).hex }}>
              {team.name.replace(/^Time /, '')}
            </span>
          </button>
        ))}
        <button
          onClick={flipSides}
          className="w-[38px] h-[38px] rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20"
          aria-label="Inverter lados"
        >
          <IconSwap size={16} />
        </button>
        <button
          onClick={() => setConfirmEnd(true)}
          className="h-[38px] px-3.5 rounded-full bg-danger/16 text-danger-soft text-[12.5px] font-bold flex items-center gap-1.5 active:bg-danger/25"
        >
          <IconStop size={12} /> Encerrar
        </button>
      </div>

      {/* fim de set */}
      <Modal open={pending !== null && !board.finished} dark>
        {pendingBoard && pending !== null && (
          <div className="text-center">
            <div className="text-lime text-[11px] font-extrabold tracking-[0.12em] uppercase">
              {lastSetOfMatch ? 'Fim de papo?' : `Fechar o ${pendingBoard.setIndex}º set?`}
            </div>
            <div className="num num-125 text-[44px] font-black mt-2">
              {pendingBoard.current[0]} <span className="text-ondark-faint">×</span> {pendingBoard.current[1]}
            </div>
            <div className="text-ondark text-[13.5px] mt-1">
              {match.teams[pending].name} levou {lastSetOfMatch ? 'a partida' : 'o set'}
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={undo}
                className="flex-1 h-12 rounded-[14px] bg-white/10 text-white text-[14px] font-bold active:bg-white/20"
              >
                Desfazer ponto
              </button>
              <button
                onClick={() => {
                  closeSet()
                  void playVictory()
                }}
                className="flex-1 h-12 rounded-[14px] bg-lime text-ink text-[14px] font-bold active:opacity-85"
              >
                {lastSetOfMatch ? 'Fim de papo' : 'Fechar set'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* encerrar manualmente */}
      <Modal open={confirmEnd} dark>
        <div className="text-center">
          <div className="text-white text-[17px] font-extrabold">
            {isTempo && clockSec <= 0 ? 'Tempo esgotado!' : 'Encerrar a partida?'}
          </div>
          <div className="text-ondark text-[13px] mt-1.5">
            {leaderNow(board) !== null
              ? `${match.teams[leaderNow(board)!].name} tá na frente.`
              : 'Tá empatado, hein.'}
          </div>
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={() => setConfirmEnd(false)}
              className="flex-1 h-12 rounded-[14px] bg-white/10 text-white text-[14px] font-bold active:bg-white/20"
            >
              Voltar
            </button>
            <button
              onClick={endMatch}
              className="flex-1 h-12 rounded-[14px] bg-danger text-white text-[14px] font-bold active:opacity-85"
            >
              Encerrar
            </button>
          </div>
        </div>
      </Modal>

      <RotateHint />
    </FullscreenBg>
  )
}

function FullscreenBg({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.background = '#0B0A0F'
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', '#0B0A0F')
    return () => {
      document.body.style.background = '#E8E6E0'
      meta?.setAttribute('content', '#F7F6F3')
    }
  }, [])
  return (
    <div className="fixed inset-0 bg-board z-40 flex flex-col items-center justify-center overflow-hidden">
      {children}
    </div>
  )
}

function RotateHint() {
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const update = () => setPortrait(mq.matches && window.innerWidth < 700)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const [hidden, setHidden] = useState(false)
  if (!portrait || hidden) return null
  return (
    <button
      onClick={() => setHidden(true)}
      className="absolute bottom-[86px] left-1/2 -translate-x-1/2 bg-white/10 text-ondark text-[11.5px] font-semibold rounded-full px-3.5 py-2 backdrop-blur-[8px]"
    >
      📱 vira o celular pra tela cheia
    </button>
  )
}
