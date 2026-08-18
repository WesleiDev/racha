import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout'
import { IconGoogle } from '../components/icons'
import { useSession } from '../state/session'
import { hasCloud } from '../data'
import { safePath } from '../lib/nav'

export function Login() {
  const signIn = useSession((s) => s.signIn)
  const nav = useNavigate()
  const [params] = useSearchParams()
  const after = safePath(params.get('depois')) ?? '/grupos'
  const invited = after.startsWith('/entrar/')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const enter = async () => {
    setBusy(true)
    setError(false)
    try {
      await signIn()
      nav(after, { replace: true })
    } catch (e) {
      console.error('[login]', e)
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen dark>
      <div className="flex-1" />
      <div className="px-7 pb-10">
        <div className="text-white font-extrabold text-[54px] leading-[0.9] tracking-[-0.045em]">
          TemJogo<span className="text-accent">.</span>
        </div>
        <p className="text-ondark text-[19px] leading-snug mt-4 max-w-[260px]">
          Sorteia os times, marca o placar, guarda a resenha.
        </p>
        {invited && (
          <div className="mt-5 inline-flex items-start gap-2.5 bg-white/7 rounded-[14px] px-3.5 py-3 max-w-[300px]">
            <span className="text-[15px] leading-none mt-[1px]">🏐</span>
            <span className="text-[13px] leading-snug text-white">
              Você foi chamado pra um grupo — entra que a gente já te coloca lá dentro.
            </span>
          </div>
        )}
      </div>
      <div className="px-6 pb-[max(34px,env(safe-area-inset-bottom))] flex flex-col gap-3.5">
        <button
          onClick={enter}
          disabled={busy}
          className="h-[58px] rounded-[16px] bg-white text-ink text-[16.5px] font-semibold flex items-center justify-center gap-3 active:bg-[#EDEBF5] transition-colors disabled:opacity-60"
        >
          <IconGoogle size={19} />
          {busy ? 'Entrando…' : invited ? 'Entrar e aceitar convite' : 'Entrar com Google'}
        </button>
        {error && (
          <div className="text-danger-soft text-[13px] text-center">Não rolou. Tenta de novo?</div>
        )}
        <div className="text-ondark-dim text-[12.5px] text-center">
          {hasCloud ? 'Sem senha, sem cadastro chato.' : 'Sem senha, sem cadastro chato. (modo local — Firebase ainda não conectado)'}
        </div>
      </div>
    </Screen>
  )
}
