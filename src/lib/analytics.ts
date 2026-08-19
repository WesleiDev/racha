import { getApps, initializeApp } from 'firebase/app'
import type { Analytics } from 'firebase/analytics'
import { firebaseConfig } from '../data/firebaseConfig'

/**
 * Eventos do app (Google Analytics para Firebase — gratuito e ilimitado).
 *
 * Regras que valem pra todo evento daqui:
 *  - nunca manda dado pessoal (nome, e-mail, foto). Só contagem e enum.
 *  - carrega o SDK sob demanda, depois que a tela já está de pé.
 *  - em modo local (sem firebaseConfig) vira no-op silencioso.
 */
export type AppEvent =
  | 'login'
  | 'grupo_criado'
  | 'entrou_por_convite'
  | 'sorteio_feito'
  | 're_sorteio'
  | 'escalacao_salva'
  | 'compartilhou_times'
  | 'partida_iniciada'
  | 'partida_encerrada'
  | 'resultado_anotado'
  | 'som_gravado'
  | 'placar_ao_vivo_aberto'

type Params = Record<string, string | number | boolean>

interface Reporter {
  send: (event: string, params?: Params) => void
}

let pending: Promise<Reporter | null> | null = null

function reporter(): Promise<Reporter | null> {
  if (pending) return pending
  pending = (async () => {
    if (!firebaseConfig?.measurementId) return null
    try {
      const { isSupported, getAnalytics, logEvent } = await import('firebase/analytics')
      if (!(await isSupported())) return null
      const app = getApps()[0] ?? initializeApp(firebaseConfig)
      const instance: Analytics = getAnalytics(app)
      return { send: (event, params) => logEvent(instance, event, params) }
    } catch {
      // bloqueador de rastreio, navegador antigo, sem rede: seguir o jogo
      return null
    }
  })()
  return pending
}

function report(event: string, params?: Params): void {
  void reporter().then((r) => {
    try {
      r?.send(event, params)
    } catch {
      /* nunca atrapalha o usuário */
    }
  })
}

/** registra um evento do app */
export function track(event: AppEvent, params?: Params): void {
  report(event, params)
}

/** troca ids por marcadores: mantém a métrica agregada e tira dado identificável da URL */
export function normalizePath(path: string): string {
  return path
    .replace(/^\/g\/[^/]+/, '/g/:grupo')
    .replace(/\/(partida|escalacao|resumo|card|jogadores)\/[^/]+/, '/$1/:id')
    .replace(/^\/ao-vivo\/[^/]+/, '/ao-vivo/:token')
    .replace(/^\/entrar\/[^/]+/, '/entrar/:token')
}

export function trackScreen(path: string): void {
  const screen = normalizePath(path)
  report('screen_view', { firebase_screen: screen, firebase_screen_class: screen })
}
