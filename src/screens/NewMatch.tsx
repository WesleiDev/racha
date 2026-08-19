import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Screen, Header, Content, BottomBar } from '../components/layout'
import { Button, Card, SectionLabel, Segmented, Stepper, Toggle } from '../components/ui'
import { SPORT_ICONS } from '../components/icons'
import { useSession } from '../state/session'
import { useSetup } from '../state/setup'
import { SPORTS, defaultConfig, type ScoringMode, type Sport } from '../data/types'

export function NewMatch() {
  const { groupId = '' } = useParams()
  const nav = useNavigate()
  const group = useSession((s) => s.groups.find((g) => g.id === groupId))
  const { config, setConfig, begin } = useSetup()

  useEffect(() => {
    if (group) begin(group.id, group.preset)
  }, [group, begin])

  if (!group) return <Screen />

  const pickSport = (sport: Sport) => {
    const d = defaultConfig(sport)
    setConfig({ sport, playersPerTeam: d.playersPerTeam, scoring: d.scoring, setPoints: d.setPoints })
  }

  const row = 'flex items-center justify-between py-3'

  return (
    <Screen>
      <Header back={`/g/${groupId}`} title="Nova partida" sub="Config rápida, presets lembrados" />
      <Content className="flex flex-col gap-4 pb-4">
        <div className="bg-accent-soft text-accent-press rounded-full px-3.5 h-9 text-[12.5px] font-semibold inline-flex items-center gap-2 self-start">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          Usando o preset da última {group.schedule ? group.schedule.split(' ')[0] : 'partida'}
        </div>

        <div>
          <SectionLabel className="mb-2">Esporte</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {SPORTS.map((s) => {
              const Icon = SPORT_ICONS[s.id]
              const active = config.sport === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => pickSport(s.id)}
                  className={`h-10 px-3.5 rounded-full border text-[13.5px] font-semibold flex items-center gap-2 transition-colors ${
                    active ? 'bg-ink text-white border-ink' : 'bg-white text-sec border-knob2'
                  }`}
                >
                  <Icon size={15} />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <SectionLabel className="mb-2">Formato</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            <Card className="p-4 flex flex-col items-center gap-2">
              <span className="text-[12.5px] font-semibold text-ter">Times</span>
              <Stepper value={config.numTeams} min={2} max={4} onChange={(v) => setConfig({ numTeams: v })} />
            </Card>
            <Card className="p-4 flex flex-col items-center gap-2">
              <span className="text-[12.5px] font-semibold text-ter">Por time</span>
              <Stepper value={config.playersPerTeam} min={1} max={11} onChange={(v) => setConfig({ playersPerTeam: v })} />
            </Card>
          </div>
        </div>

        <div>
          <SectionLabel className="mb-2">Pontuação</SectionLabel>
          <Segmented<ScoringMode>
            options={[
              { id: 'sets', label: 'Sets' },
              { id: 'tenis', label: 'Tênis' },
              { id: 'tempo', label: 'Tempo' },
              { id: 'livre', label: 'Livre' },
            ]}
            value={config.scoring}
            onChange={(v) => setConfig({ scoring: v })}
          />

          {config.scoring === 'tenis' && (
            <Card className="px-4 mt-2.5 divide-y divide-field">
              <div className="py-3 text-[12.5px] text-ter leading-snug">
                Contagem de raquete: 15, 30, 40, vantagem. Game, set e partida.
              </div>
              <div className={row}>
                <span className="text-[14.5px] text-ink font-medium">Games por set</span>
                <Stepper
                  value={config.gamesPerSet ?? 6}
                  min={3}
                  max={9}
                  onChange={(v) => setConfig({ gamesPerSet: v })}
                />
              </div>
              <div className={row}>
                <div>
                  <div className="text-[14.5px] text-ink font-medium">Ponto de ouro</div>
                  <div className="text-[12px] text-ter">em 40-40 o próximo ponto decide (sem vantagem)</div>
                </div>
                <Toggle on={Boolean(config.noAd)} onChange={(v) => setConfig({ noAd: v })} />
              </div>
              <div className={row}>
                <div>
                  <div className="text-[14.5px] text-ink font-medium">Tiebreak</div>
                  <div className="text-[12px] text-ter">
                    em {config.gamesPerSet ?? 6}-{config.gamesPerSet ?? 6}
                  </div>
                </div>
                <Stepper value={config.tiebreakPoints} min={5} max={12} onChange={(v) => setConfig({ tiebreakPoints: v })} />
              </div>
              <div className={row}>
                <span className="text-[14.5px] text-ink font-medium">Melhor de</span>
                <div className="flex items-center gap-2">
                  {[1, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setConfig({ bestOf: n })}
                      className={`h-9 px-3 rounded-[10px] text-[13.5px] font-bold ${
                        config.bestOf === n ? 'bg-ink text-white' : 'bg-field text-sec'
                      }`}
                    >
                      {n} {n === 1 ? 'set' : 'sets'}
                    </button>
                  ))}
                </div>
              </div>
              {config.bestOf > 1 && (
                <div className={row}>
                  <div>
                    <div className="text-[14.5px] text-ink font-medium">Super tiebreak no decisivo</div>
                    <div className="text-[12px] text-ter">último set vira tiebreak de {config.superTiebreakPoints ?? 10}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      on={Boolean(config.superTiebreakFinal)}
                      onChange={(v) => setConfig({ superTiebreakFinal: v })}
                    />
                    {config.superTiebreakFinal && (
                      <Stepper
                        value={config.superTiebreakPoints ?? 10}
                        min={5}
                        max={21}
                        onChange={(v) => setConfig({ superTiebreakPoints: v })}
                      />
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {config.scoring === 'sets' && (
            <Card className="px-4 mt-2.5 divide-y divide-field">
              <div className={row}>
                <span className="text-[14.5px] text-ink font-medium">Pontos por set</span>
                <Stepper value={config.setPoints} min={5} max={35} onChange={(v) => setConfig({ setPoints: v })} />
              </div>
              <div className={row}>
                <div>
                  <div className="text-[14.5px] text-ink font-medium">Vantagem de 2</div>
                  <div className="text-[12px] text-ter">só fecha com 2 de diferença</div>
                </div>
                <Toggle on={config.advantage2} onChange={(v) => setConfig({ advantage2: v })} />
              </div>
              <div className={row}>
                <span className="text-[14.5px] text-ink font-medium">Melhor de</span>
                <div className="flex items-center gap-2">
                  {[1, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setConfig({ bestOf: n })}
                      className={`h-9 px-3 rounded-[10px] text-[13.5px] font-bold ${
                        config.bestOf === n ? 'bg-ink text-white' : 'bg-field text-sec'
                      }`}
                    >
                      {n} {n === 1 ? 'set' : 'sets'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={row}>
                <span className="text-[14.5px] text-ink font-medium">Tiebreak</span>
                <Stepper value={config.tiebreakPoints} min={5} max={25} onChange={(v) => setConfig({ tiebreakPoints: v })} />
              </div>
            </Card>
          )}

          {config.scoring === 'tempo' && (
            <Card className="px-4 mt-2.5">
              <div className={row}>
                <div>
                  <div className="text-[14.5px] text-ink font-medium">Minutos</div>
                  <div className="text-[12px] text-ter">cronômetro com pausa no placar</div>
                </div>
                <Stepper value={config.timeMinutes} min={1} max={60} onChange={(v) => setConfig({ timeMinutes: v })} />
              </div>
            </Card>
          )}

          {config.scoring === 'livre' && (
            <Card className="px-4 mt-2.5 divide-y divide-field">
              <div className={row}>
                <div>
                  <div className="text-[14.5px] text-ink font-medium">Primeiro a</div>
                  <div className="text-[12px] text-ter">quem chegar primeiro leva</div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle on={config.freeTarget !== null} onChange={(v) => setConfig({ freeTarget: v ? 12 : null })} />
                  {config.freeTarget !== null && (
                    <Stepper value={config.freeTarget} min={3} max={50} onChange={(v) => setConfig({ freeTarget: v })} />
                  )}
                </div>
              </div>
              {config.freeTarget === null && (
                <div className="py-3 text-[12.5px] text-ter">Contagem aberta — encerra quando vocês quiserem.</div>
              )}
            </Card>
          )}
        </div>
      </Content>

      <BottomBar>
        <Button onClick={() => nav(`/g/${groupId}/checkin`)}>Quem veio hoje?</Button>
      </BottomBar>
    </Screen>
  )
}
