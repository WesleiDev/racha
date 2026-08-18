import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/layout'
import { IconBack, IconDownload } from '../components/icons'
import { useRoster } from '../state/roster'
import { useLive } from '../state/live'
import { drawResultCard, shareCard, canvasToBlob } from '../lib/shareCard'
import { matchWinner } from '../lib/rank'
import { allSets, computeBoard } from '../lib/scoring'

export function ShareCardScreen() {
  const { groupId = '', matchId = '' } = useParams()
  const nav = useNavigate()
  const { matches } = useRoster()
  const liveMatch = useLive((s) => s.match)
  const match = matches.find((m) => m.id === matchId) ?? (liveMatch?.id === matchId ? liveMatch : null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (match && canvasRef.current) {
      const mvpName = match.mvpPlayerId ? match.players[match.mvpPlayerId]?.name : undefined
      void drawResultCard(canvasRef.current, match, match.groupName, mvpName)
    }
  }, [match])

  if (!match) return <Screen dark />

  const whatsapp = async () => {
    if (!canvasRef.current) return
    const winner = matchWinner(match)
    const board = computeBoard(match.config, match.events, match.serveStart, match.teams.length)
    const sets = allSets(board)
      .map((s) => `${s[0]}-${s[1]}`)
      .join(' · ')
    const text =
      winner !== null
        ? `${match.teams[winner].name} levou o rachão! ${sets} 🏆 — via Racha`
        : `Deu empate no rachão: ${sets} — via Racha`
    const result = await shareCard(canvasRef.current, text)
    setStatus(result === 'shared' ? null : 'Imagem baixada — cola lá no grupo!')
  }

  const download = async () => {
    if (!canvasRef.current) return
    const blob = await canvasToBlob(canvasRef.current)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'racha-resultado.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    setStatus('Imagem salva!')
  }

  return (
    <Screen dark>
      <div className="px-5 pt-[max(14px,env(safe-area-inset-top))] flex items-center gap-3">
        <button
          onClick={() => nav(-1)}
          className="w-[34px] h-[34px] -ml-1.5 rounded-full flex items-center justify-center text-white active:bg-white/10"
          aria-label="Voltar"
        >
          <IconBack size={20} />
        </button>
        <div>
          <div className="text-white text-[20px] font-extrabold tracking-[-0.02em]">Card do resultado</div>
          <div className="text-ondark-ter text-[12px]">O card sai como imagem, 1080×1350.</div>
        </div>
      </div>

      <div className="px-6 mt-4 flex-1">
        <canvas
          ref={canvasRef}
          className="w-full rounded-[24px] shadow-[0_24px_48px_-18px_rgba(0,0,0,0.6)]"
          style={{ aspectRatio: '1080 / 1350' }}
        />
      </div>

      <div className="px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-4 flex flex-col gap-2.5">
        {status && <div className="text-lime text-[13px] text-center font-semibold">{status}</div>}
        <button
          onClick={() => void whatsapp()}
          className="h-[54px] rounded-[15px] bg-success text-white text-[16px] font-bold active:opacity-90 flex items-center justify-center gap-2.5"
        >
          <WhatsIcon /> Enviar no WhatsApp
        </button>
        <button
          onClick={() => void download()}
          className="h-12 rounded-[14px] border border-white/25 text-white text-[14.5px] font-bold active:bg-white/10 flex items-center justify-center gap-2"
        >
          <IconDownload size={16} color="#fff" /> Salvar imagem
        </button>
      </div>
    </Screen>
  )
}

function WhatsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 2a9.9 9.9 0 0 0-8.6 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.1-.4 3.6 1 1.9 2.5 3.5 4.4 4.6 2.2 1.2 3.1 1.1 3.9.9.7-.2 1.5-.8 1.7-1.5.2-.7.2-1.3.1-1.4l-.9-.4z" />
    </svg>
  )
}
