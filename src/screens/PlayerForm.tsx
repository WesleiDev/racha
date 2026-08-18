import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, Notice, Toggle } from '../components/ui'
import { StarPicker } from '../components/player'
import { useRoster } from '../state/roster'
import { useSetup } from '../state/setup'
import { AVATAR_COLORS, initials } from '../lib/colors'
import { newId } from '../lib/id'

export function PlayerForm() {
  const { groupId = '', playerId } = useParams()
  const [search] = useSearchParams()
  const fromCheckin = search.get('de') === 'checkin'
  const nav = useNavigate()
  const { players, addPlayer, updatePlayer } = useRoster()
  const togglePresent = useSetup((s) => s.togglePresent)

  const editing = useMemo(() => players.find((p) => p.id === playerId), [players, playerId])

  const [name, setName] = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
  const [half, setHalf] = useState(editing ? editing.stars % 1 !== 0 : true)
  const [stars, setStars] = useState(editing?.stars ?? 2.5)
  const [guest, setGuest] = useState(editing?.guest ?? fromCheckin)

  const pickStars = (v: number) => setStars(v)

  const toggleHalf = (on: boolean) => {
    setHalf(on)
    if (on && stars >= 2) setStars(stars - 0.5)
    if (!on && stars % 1 !== 0) setStars(Math.ceil(stars))
  }

  const save = () => {
    const player = {
      id: editing?.id ?? newId(),
      name: name.trim(),
      color,
      stars,
      active: editing?.active ?? true,
      guest,
      createdAt: editing?.createdAt ?? Date.now(),
    }
    if (editing) void updatePlayer(player)
    else {
      void addPlayer(player)
      if (fromCheckin) togglePresent(player.id)
    }
    nav(-1)
  }

  return (
    <Screen>
      <Header
        back
        title={editing ? 'Editar jogador' : 'Novo jogador'}
        sub={editing ? undefined : 'Nome e nível. 5 segundos.'}
      />
      <Content className="flex flex-col gap-5 pb-4 pt-2">
        {/* avatar + swatches */}
        <div className="flex items-center gap-4">
          <span
            style={{ background: color }}
            className="w-[66px] h-[66px] rounded-full flex-none flex items-center justify-center text-[22px] font-bold text-white"
          >
            {initials(name || '?')}
          </span>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c, boxShadow: color === c ? '0 0 0 2px #F7F6F3, 0 0 0 4px #15141A' : undefined }}
                className="w-6 h-6 rounded-full"
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          autoFocus={!editing}
          className="w-full h-[54px] rounded-[15px] border-[1.5px] border-accent bg-white px-4 text-[17px] text-ink outline-none placeholder:text-dis"
        />

        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-semibold text-sec">Nível no sorteio</div>
          <StarPicker value={stars} onChange={pickStars} half={half} />
          <div className="flex items-center justify-between mt-1">
            <div>
              <div className="text-[14.5px] font-medium text-ink">Meia estrela</div>
              <div className="text-[12px] text-ter">
                {stars < 2 && !half ? 'a partir de 2 estrelas' : 'meio ponto abaixo da estrela escolhida'}
              </div>
            </div>
            <Toggle on={half} onChange={toggleHalf} disabled={stars < 2 && !half} />
          </div>
        </div>

        <Notice>O nível é usado só pra equilibrar o sorteio. Ninguém mais vê.</Notice>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14.5px] font-medium text-ink">Só pra hoje (avulso)</div>
            <div className="text-[12px] text-ter">não entra na lista fixa do grupo</div>
          </div>
          <Toggle on={guest} onChange={setGuest} />
        </div>
      </Content>

      <BottomBar>
        <Button onClick={save} disabled={!name.trim()}>
          Salvar jogador
        </Button>
      </BottomBar>
    </Screen>
  )
}
