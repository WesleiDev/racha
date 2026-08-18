import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen } from '../components/layout'
import { Button } from '../components/ui'
import { useSession } from '../state/session'

type Phase = 'checking' | 'joining' | 'notfound' | 'error'

/**
 * Destino do link de convite: /entrar/:token
 * Sem sessão → manda pro login guardando o convite; na volta o convite é
 * aceito sozinho e o usuário cai direto no grupo.
 */
export function JoinInvite() {
  const { token = '' } = useParams()
  const nav = useNavigate()
  const { user, ready, joinByToken } = useSession()
  const [phase, setPhase] = useState<Phase>('checking')
  const started = useRef(false)

  useEffect(() => {
    if (!ready) return

    if (!user) {
      nav(`/login?depois=${encodeURIComponent(`/entrar/${token}`)}`, { replace: true })
      return
    }

    if (started.current) return
    started.current = true
    setPhase('joining')
    joinByToken(token)
      .then((groupId) => {
        if (groupId) nav(`/g/${groupId}`, { replace: true })
        else setPhase('notfound')
      })
      .catch(() => setPhase('error'))
  }, [ready, user, token, joinByToken, nav])

  const retry = () => {
    started.current = false
    setPhase('checking')
    setPhase('joining')
    joinByToken(token)
      .then((groupId) => (groupId ? nav(`/g/${groupId}`, { replace: true }) : setPhase('notfound')))
      .catch(() => setPhase('error'))
  }

  return (
    <Screen dark>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
        <div className="text-white font-extrabold text-[34px] tracking-[-0.04em]">
          TemJogo<span className="text-accent">.</span>
        </div>

        {(phase === 'checking' || phase === 'joining') && (
          <div className="text-ondark text-[14px]">
            {phase === 'joining' ? 'Entrando no grupo…' : 'Abrindo o convite…'}
          </div>
        )}

        {phase === 'notfound' && (
          <>
            <div className="text-ondark text-[15px]">Convite não encontrado ou vencido.</div>
            <div className="text-ondark-dim text-[12.5px] max-w-[260px]">
              Pede pra quem organiza mandar o link de novo.
            </div>
            <div className="w-full max-w-[280px] mt-4">
              <Button variant="glass" onClick={() => nav('/grupos', { replace: true })}>
                Ver meus grupos
              </Button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="text-ondark text-[15px]">Não deu pra entrar agora.</div>
            <div className="text-ondark-dim text-[12.5px] max-w-[260px]">
              Pode ser a internet. Tenta de novo?
            </div>
            <div className="w-full max-w-[280px] mt-4 flex flex-col gap-2.5">
              <Button variant="lime" onClick={retry}>
                Tentar de novo
              </Button>
              <Button variant="glass" onClick={() => nav('/grupos', { replace: true })}>
                Ver meus grupos
              </Button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
