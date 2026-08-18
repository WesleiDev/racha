import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../data'
import type { Match } from '../data/types'
import { BoardHalves } from '../components/board'
import { computeBoard } from '../lib/scoring'
import { useWakeLock } from '../lib/device'

/** placar ao vivo do espectador — link público, só leitura, tempo real */
export function LiveView() {
  const { token = '' } = useParams()
  const [match, setMatch] = useState<Match | null>(null)
  const [loaded, setLoaded] = useState(false)
  useWakeLock(match !== null)

  useEffect(() => {
    document.body.style.background = '#0B0A0F'
    const stop = db.watchLive(token, (m) => {
      setMatch(m)
      setLoaded(true)
    })
    return () => {
      stop()
      document.body.style.background = '#E8E6E0'
    }
  }, [token])

  if (!loaded) return <div className="fixed inset-0 bg-board" />

  if (!match || match.status !== 'live') {
    return (
      <div className="fixed inset-0 bg-board flex flex-col items-center justify-center gap-2 px-8 text-center">
        <div className="text-white text-[20px] font-extrabold tracking-[-0.02em]">
          Racha<span className="text-accent">.</span>
        </div>
        <div className="text-ondark text-[14px]">Ninguém jogando nesse link agora.</div>
        <div className="text-ondark-dim text-[12px]">Pede o link novo pra quem tá com o placar.</div>
      </div>
    )
  }

  const board = computeBoard(match.config, match.events, match.serveStart, match.teams.length)

  return (
    <div className="fixed inset-0 bg-board overflow-hidden">
      <BoardHalves match={match} board={board} />

      <div className="absolute top-[max(10px,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-danger/18 rounded-full px-3.5 py-1.5">
        <span className="w-2 h-2 rounded-full bg-danger animate-racha-pulse" />
        <span className="text-white text-[11px] font-extrabold tracking-[0.12em]">AO VIVO</span>
      </div>

      <div className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-0 right-0 text-center pointer-events-none">
        <div className="text-ondark-ter text-[12px] font-semibold">
          {match.groupName}
          {match.config.scoring === 'sets' ? ` · ${board.setIndex}º set` : ''} · só leitura
        </div>
        <div className="text-ondark-faint text-[11px] num num-112 mt-0.5">
          {location.host}/ao-vivo/{token}
        </div>
      </div>
    </div>
  )
}
