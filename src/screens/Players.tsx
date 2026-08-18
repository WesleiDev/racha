import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content } from '../components/layout'
import { TabBar } from '../components/tabbar'
import { Button, EmptyState, Notice, SearchField, Sheet } from '../components/ui'
import { Avatar, Stars } from '../components/player'
import { IconDots } from '../components/icons'
import { useRoster } from '../state/roster'
import { useSession, isAdmin } from '../state/session'
import type { Player } from '../data/types'

export function Players() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const { players, load, groupId: loaded, updatePlayer, removePlayer } = useRoster()
  const { user, groups } = useSession()
  const group = groups.find((g) => g.id === groupId)
  const admin = isAdmin(group, user)
  const [q, setQ] = useState('')
  const [menuFor, setMenuFor] = useState<Player | null>(null)

  useEffect(() => {
    if (groupId && loaded !== groupId) void load(groupId)
  }, [groupId, loaded, load])

  const list = useMemo(() => {
    const actives = players.filter((p) => p.active && !p.guest)
    const filtered = q ? actives.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : actives
    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [players, q])

  const activeCount = players.filter((p) => p.active && !p.guest).length

  return (
    <Screen>
      <Header back={`/g/${groupId}`} title="Jogadores" sub={`${activeCount} ativos`} />
      <Content className="flex flex-col gap-3 pb-4">
        <SearchField value={q} onChange={setQ} placeholder="Buscar jogador" />
        {admin && (
          <Notice icon={<Stars value={1} size={11} />}>
            As estrelas só aparecem pra organizadores — equilíbrio sem constrangimento.
          </Notice>
        )}

        {list.length === 0 && !q && (
          <EmptyState
            emoji="📋"
            title="Cadastra a galera"
            sub="Nome e nível em 5 segundos por pessoa. Depois é só marcar presença e sortear."
          />
        )}

        <div className="flex flex-col">
          {list.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 py-2 ${i > 0 ? 'border-t border-field' : ''}`}>
              <Avatar name={p.name} color={p.color} />
              <span className="flex-1 text-[15.5px] font-medium text-ink">{p.name}</span>
              {admin && <Stars value={p.stars} size={13.5} />}
              {admin && (
                <button
                  onClick={() => setMenuFor(p)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ter active:bg-field"
                  aria-label={`Opções de ${p.name}`}
                >
                  <IconDots size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Content>

      {admin ? (
        <div className="px-5 pb-3">
          <Button variant="black" size="md" className="h-[52px]" onClick={() => nav(`/g/${groupId}/jogadores/novo`)}>
            + Novo jogador
          </Button>
        </div>
      ) : (
        <div className="px-5 pb-3 text-[12.5px] text-ter text-center">
          Quem organiza o grupo cuida da lista de jogadores.
        </div>
      )}
      <TabBar groupId={groupId} active="jogadores" />

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)}>
        {menuFor && (
          <div className="px-5 pt-3 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={menuFor.name} color={menuFor.color} size={44} />
              <div>
                <div className="text-[17px] font-bold text-ink">{menuFor.name}</div>
                {admin && <Stars value={menuFor.stars} size={13} />}
              </div>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                nav(`/g/${groupId}/jogadores/${menuFor.id}`)
                setMenuFor(null)
              }}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                void updatePlayer({ ...menuFor, active: false })
                setMenuFor(null)
              }}
            >
              Inativar (some da lista, mantém histórico)
            </Button>
            <Button
              variant="outline"
              size="md"
              className="!text-danger !border-danger/40"
              onClick={() => {
                void removePlayer(menuFor.id)
                setMenuFor(null)
              }}
            >
              Excluir de vez
            </Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}
