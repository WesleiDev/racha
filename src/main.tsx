import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles.css'
import { App } from './App'

/**
 * Versão nova no ar → recarrega sozinho.
 * Sem isso o service worker serve a versão antiga do cache até o usuário
 * fechar e abrir o app (correção de bug não chegava na quadra).
 */
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    location.reload()
  })
}

registerSW({ immediate: true })

console.info(`TemJogo · versão ${__BUILD_TIME__}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
