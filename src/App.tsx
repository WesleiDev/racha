import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { useSession } from './state/session'
import { safePath } from './lib/nav'
import { Login } from './screens/Login'
import { Groups } from './screens/Groups'
import { GroupDashboard } from './screens/GroupDashboard'
import { Players } from './screens/Players'
import { PlayerForm } from './screens/PlayerForm'
import { NewMatch } from './screens/NewMatch'
import { CheckIn } from './screens/CheckIn'
import { Draw } from './screens/Draw'
import { Scoreboard } from './screens/Scoreboard'
import { Summary } from './screens/Summary'
import { ShareCardScreen } from './screens/ShareCardScreen'
import { History } from './screens/History'
import { MatchDetail } from './screens/MatchDetail'
import { Ranking } from './screens/Ranking'
import { GroupSettings } from './screens/GroupSettings'
import { Lineup } from './screens/Lineup'
import { LiveView } from './screens/LiveView'
import { JoinInvite } from './screens/JoinInvite'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useSession()
  const loc = useLocation()
  if (!ready) return <div className="app-col bg-paper" />
  // guarda o destino: depois do login o usuário volta pra onde queria ir
  if (!user) {
    const back = encodeURIComponent(loc.pathname + loc.search)
    return <Navigate to={`/login?depois=${back}`} replace />
  }
  return <>{children}</>
}

function LoginRoute() {
  const { user, ready } = useSession()
  const [params] = useSearchParams()
  const after = safePath(params.get('depois'))
  if (ready && user) return <Navigate to={after ?? '/grupos'} replace />
  return <Login />
}

function HomeRedirect() {
  const { user, ready, groups, groupsLoaded } = useSession()
  if (!ready) return <div className="app-col bg-paper" />
  if (!user) return <Navigate to="/login" replace />
  if (!groupsLoaded) return <div className="app-col bg-paper" />
  if (groups.length === 1) return <Navigate to={`/g/${groups[0].id}`} replace />
  return <Navigate to="/grupos" replace />
}

export function App() {
  const init = useSession((s) => s.init)
  useEffect(() => init(), [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginRoute />} />
        {/* espectador: público, sem login */}
        <Route path="/ao-vivo/:token" element={<LiveView />} />
        <Route path="/entrar/:token" element={<JoinInvite />} />

        <Route path="/grupos" element={<RequireAuth><Groups /></RequireAuth>} />
        <Route path="/g/:groupId" element={<RequireAuth><GroupDashboard /></RequireAuth>} />
        <Route path="/g/:groupId/jogadores" element={<RequireAuth><Players /></RequireAuth>} />
        <Route path="/g/:groupId/jogadores/novo" element={<RequireAuth><PlayerForm /></RequireAuth>} />
        <Route path="/g/:groupId/jogadores/:playerId" element={<RequireAuth><PlayerForm /></RequireAuth>} />
        <Route path="/g/:groupId/nova-partida" element={<RequireAuth><NewMatch /></RequireAuth>} />
        <Route path="/g/:groupId/checkin" element={<RequireAuth><CheckIn /></RequireAuth>} />
        <Route path="/g/:groupId/sorteio" element={<RequireAuth><Draw /></RequireAuth>} />
        <Route path="/g/:groupId/escalacao/:matchId" element={<RequireAuth><Lineup /></RequireAuth>} />
        <Route path="/g/:groupId/placar" element={<RequireAuth><Scoreboard /></RequireAuth>} />
        <Route path="/g/:groupId/resumo/:matchId" element={<RequireAuth><Summary /></RequireAuth>} />
        <Route path="/g/:groupId/card/:matchId" element={<RequireAuth><ShareCardScreen /></RequireAuth>} />
        <Route path="/g/:groupId/historico" element={<RequireAuth><History /></RequireAuth>} />
        <Route path="/g/:groupId/partida/:matchId" element={<RequireAuth><MatchDetail /></RequireAuth>} />
        <Route path="/g/:groupId/ranking" element={<RequireAuth><Ranking /></RequireAuth>} />
        <Route path="/g/:groupId/config" element={<RequireAuth><GroupSettings /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
