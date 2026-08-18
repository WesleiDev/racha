import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/layout'
import { Button } from '../components/ui'
import { useSession } from '../state/session'
import { db } from '../data'
import { sportLabel, type Sport } from '../data/types'

/** destino do link de convite: /entrar/:token */
export function JoinInvite() {
  const { token = '' } = useParams()
  const nav = useNavigate()
  const { user, joinByToken } = useSession()
  const [info, setInfo] = useState<{ name: string; sport: Sport; schedule: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void db.findGroupByInvite(token).then((g) => {
      if (g) setInfo({ name: g.name, sport: g.sport, schedule: g.schedule })
      else setNotFound(true)
    })
  }, [token])

  const join = async () => {
    if (!user) {
      nav(`/login?depois=/entrar/${token}`)
      return
    }
    setBusy(true)
    const g = await joinByToken(token)
    setBusy(false)
    if (g) nav(`/g/${g.id}`, { replace: true })
    else setNotFound(true)
  }

  return (
    <Screen dark>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <div className="text-white font-extrabold text-[34px] tracking-[-0.04em]">
          Racha<span className="text-accent">.</span>
        </div>
        {notFound ? (
          <>
            <div className="text-ondark text-[15px]">Convite não encontrado ou vencido.</div>
            <button onClick={() => nav('/')} className="text-lime text-[14px] font-bold">
              ir pro início
            </button>
          </>
        ) : info ? (
          <>
            <div className="text-ondark text-[15px]">Você foi chamado pro grupo</div>
            <div className="text-white text-[24px] font-extrabold tracking-[-0.02em]">{info.name}</div>
            <div className="text-ondark-ter text-[13px]">
              {sportLabel(info.sport)}
              {info.schedule ? ` · ${info.schedule}` : ''}
            </div>
            <div className="w-full max-w-[280px] mt-4">
              <Button variant="lime" onClick={() => void join()} disabled={busy}>
                {user ? 'Entrar no grupo' : 'Entrar com Google'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-ondark-ter text-[14px]">carregando convite…</div>
        )}
      </div>
    </Screen>
  )
}
