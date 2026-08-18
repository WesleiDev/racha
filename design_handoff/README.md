# Handoff: Racha — app de partidas casuais (Fase 1 + telas-chave da Fase 2)

## Visão geral

App web (PWA, mobile-first) para organizar partidas casuais de qualquer esporte: cadastrar jogadores, sortear times equilibrados por estrelas, marcar o placar na quadra e guardar histórico e ranking do grupo. Persona principal: o **organizador**.

Este pacote contém o protótipo de UI/UX de 16 telas navegáveis. O fluxo feliz é:

`Login → Home (grupos) → Grupo → Nova partida → Check-in → Sorteio/Times → Placar → Resumo → Card de compartilhamento` , com ramificações para `Jogadores → Novo jogador`, `Histórico → Detalhe`, `Ranking`, `Configurações` e `Placar ao vivo (espectador)`.

## Sobre os arquivos de design

`Racha - Protótipo.dc.html` (+ `support.js`, runtime dele) é uma **referência de design feita em HTML** — um protótipo do visual e do comportamento pretendidos, **não código de produção**. A tarefa é **recriar essas telas no ambiente do codebase alvo** (React + Vite, Next.js, Vue etc.), usando os padrões e bibliotecas dele. Como o repositório `WesleiDev/racha` está vazio, a recomendação abaixo em "Stack sugerida" vale como ponto de partida.

Abra o arquivo direto no navegador para navegar: o índice à esquerda pula para qualquer tela; o "celular" no centro muda de portrait para landscape nas telas de placar.

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios e microcopy são finais e devem ser reproduzidos com precisão. As interações implementadas no protótipo (toggles de check-in, +1/−1/desfazer no placar, inverter lados, seletor de estrelas) refletem o comportamento esperado; o resto usa dados fixos.

## Stack sugerida (repo vazio)

- Vite + React + TypeScript, PWA via `vite-plugin-pwa`.
- Firebase: Auth (Google), Firestore com persistência offline (`enableIndexedDbPersistence`), Hosting.
- Roteamento: React Router. Estado local por tela; Firestore como fonte da verdade.
- Sem framework de UI pesado — o design é simples o bastante para CSS Modules ou Tailwind com os tokens abaixo.

## Design tokens

### Cores — app (tema claro)

| Papel | Hex |
|---|---|
| Fundo da página (fora do device) | `#E8E6E0` / gradiente radial `#F2F0EA → #E4E1D9` |
| Fundo de tela (paper) | `#F7F6F3` |
| Superfície de card | `#FFFFFF` |
| Superfície sutil (linhas de tabela, chips) | `#FAF9F6` |
| Campo/fundo inerte | `#EFEDE7` |
| Borda de card | `#E6E4DE` |
| Divisor interno | `#EFEDE7` |
| Borda forte / outline | `#D6D3CA` |
| Texto primário (ink) | `#15141A` |
| Texto secundário | `#57545F` |
| Texto terciário / label | `#6E6B7B` |
| Texto desativado / placeholder | `#9A97A5` |
| Ícone inerte / knob off | `#C9C6D2` / `#DFDCD4` |

### Cores — marca e sinal

| Papel | Hex |
|---|---|
| Acento primário (roxo) | `#7C4DFF` |
| Acento pressionado / hover | `#5A28E8` |
| Acento suave (fundo) | `#F4F1FF` |
| Borda acento suave | `#C9C4E8` |
| Destaque lima (vitória, saque, CTA festivo) | `#D6FF3F` |
| Sucesso | `#00A86B` (fundo `#EAFBF2`, texto `#00714A`) |
| Alerta / offline | `#FFC93C` |
| Perigo (encerrar) | `#F2352C` (fundo `rgba(242,53,44,.16)`, texto `#FF8A82`) |
| Ouro (estrelas) | `#FFB300`; meia estrela pálida `#FFE3A6` |
| Aviso (fundo/texto) | `#FFF4E5` / `#B45309` |

### Paleta de cores de time (8 nomeadas)

`Roxo #7C4DFF` · `Laranja #FF6A1F` · `Verde #00A86B` · `Azul #2B7FFF` · `Rosa #FF4D96` · `Vermelho #F2352C` · `Amarelo #FFB300` · `Preto #23222A`

Tints usados nos headers de card de time: Roxo `#F4F1FF`, Laranja `#FFF3EB`.

### Superfícies escuras (placar, login, resumo, card de share)

| Papel | Hex |
|---|---|
| Fundo do placar | `#0B0A0F` |
| Fundo escuro do app (login, resumo, card) | `#15141A` |
| Superfície escura elevada | `#2A2833` |
| Texto sobre escuro — primário | `#FFFFFF` |
| Texto sobre escuro — secundário | `#A9A5B8` |
| Texto sobre escuro — terciário | `#8C889B` / `#7E7A90` |
| Texto sobre escuro — apagado | `#6E6B7B` / `#4E4B59` |
| Overlay de vidro | `rgba(255,255,255,.07)` a `.12`; hover `.18`–`.22` |
| Divisor sobre escuro | `rgba(255,255,255,.08)`–`.10` |

Gradiente da metade do placar: `linear-gradient(180deg, rgba(COR,.30) 0%, rgba(COR,.06) 100%)`; hover `.42 → .10`.
Gradiente do CTA "Nova partida": `linear-gradient(150deg, #7C4DFF 0%, #5A28E8 100%)`.

### Tipografia

- **Interface:** `Bricolage Grotesque` (Google Fonts, variável — `opsz 12..96`, `wdth 75..100`, `wght 300..800`).
- **Números / painel:** `Archivo` (variável, `wdth 62..125`, `wght 400..900`), sempre com `font-variant-numeric: tabular-nums`. `font-stretch` usado: 112%, 118%, 125%.

| Uso | Family | Tamanho | Peso | Letter-spacing |
|---|---|---|---|---|
| Placar gigante | Archivo 125% | 168px / line-height .82 | 900 | -0.04em |
| Wordmark login | Bricolage | 62px / .9 | 800 | -0.045em |
| Título de tela grande (grupo) | Bricolage | 28px | 800 | -0.035em |
| Título de tela | Bricolage | 22px | 800 | -0.03em |
| CTA "Nova partida" | Bricolage | 30px | 800 | -0.035em |
| Placar do resumo | Archivo 125% | 52px | 900 | — |
| Placar do card de share | Archivo 125% | 44px | 900 | — |
| Nome de time (card) | Bricolage | 17px | 700 | -0.02em |
| Nome de time (placar) | Bricolage | 17px | 700 | +0.02em |
| Item de lista / linha | Bricolage | 14.5–15.5px | 500 | — |
| Botão / CTA | Bricolage | 15–16px | 600–700 | — |
| Label de seção (uppercase) | Bricolage | 11–12px | 700 | .08em |
| Texto auxiliar | Bricolage | 11.5–13px | 400–500 | — |
| Badge "SAQUE" / "AO VIVO" | Bricolage | 9.5–11px | 800 | .06–.12em |

### Espaçamento, raio, sombra

- Padding de tela: `20px` lateral. Header de tela: `10px 20px 8–12px`. Rodapé fixo: `12px 20px 26px` com `border-top: 1px solid #E6E4DE`.
- Gap padrão entre cards: `10–12px`; entre linhas de lista: `6–8px`.
- Raios: pill `999px`; botão/CTA `15px`; campo `12–15px`; card `16–20px`; card grande / bottom sheet `20–24px`; device `52px` (portrait) / `44px` (landscape), tela interna `42px` / `34px`.
- Alturas: CTA principal `54px`; botão secundário `48–52px`; campo `42–54px`; linha de lista `~48px` (alvo de toque ≥ 44px em toda parte).
- Sombras: card do device `0 50px 90px -30px rgba(24,20,40,.55)`; card de share `0 24px 48px -18px rgba(21,20,26,.45)`; segmented ativo `0 1px 3px rgba(20,18,30,.10)`.
- Barra de controles do placar e bottom bar usam `backdrop-filter: blur(8–10px)`.

### Animações

- `rachaFall` — confete no resumo: `translateY(-40px) → 300px` + `rotate(0 → 420deg)`, opacidade 0→1→0; duração `2.6–4.4s` linear, delays `0–2.4s`, infinito.
- `rachaPulse` — pontos "ao vivo" e "offline": opacidade `1 → .25 → 1`, `1.4–1.6s ease-in-out` infinito.
- Transição de orientação do device: `width/height .5s cubic-bezier(.65,0,.35,1)`, `border-radius .5s ease`.
- No app real: pulso de `scale(1 → 1.06)` de ~120ms na metade tocada do placar, junto com o som do time.

## Telas

### 1. Login
Fundo `#15141A`, três blocos verticais (topo vazio, marca ao centro-baixo, ações no rodapé). Wordmark "Racha" 62px/800 branco + ponto roxo 11px. Tagline 19px `#A9A5B8`, máx. 260px: "Sorteia os times, marca o placar, guarda a resenha." Botão branco 58px, raio 16px, ícone Google colorido 19px + "Entrar com Google" 16.5px/600 `#15141A`; hover `#EDEBF5`. Nota 12.5px `#6E6B7B`: "Sem senha, sem cadastro chato." Sem status bar.

### 2. Home / Meus grupos
Título "Meus grupos" 27px/800 + avatar 36px pill `#DDD8F5` texto `#5A28E8`. Cards de grupo (raio 20px, borda `#E6E4DE`, hover borda `#7C4DFF`): eyebrow do esporte 11px/700 uppercase colorido, ponto separador 4px, "14 membros"; nome 22px/700; rodapé separado por `1px #EFEDE7` com "Última:" e o placar com pontos de cor dos times. Grupo sem partidas: `opacity .72` e "Nenhuma partida ainda". Dois botões 48px: "Criar grupo" (preto `#15141A`) e "Entrar por link" (outline `#D6D3CA`).

### 3. Grupo (dashboard)
Eyebrow "Vôlei · terça 20h" roxo; título 28px/800; botão de engrenagem circular 34px outline → Configurações.
**CTA "Nova partida":** card gradiente roxo, raio 24px, padding 24px, com anel decorativo (círculo 150px, `border: 26px solid rgba(255,255,255,.10)`, posicionado `top/right: -30px`); título 30px/800 branco + subtítulo "Bora jogar · sorteio em 3 toques" `rgba(255,255,255,.78)`.
Card "Última partida · 12 ago" (→ detalhe) com times e placar Archivo 24px. Card "Ranking do grupo" com top 3 (posição em cor de medalha `#FFB300`/`#9A97A5`/`#C08457`, avatar 26px, nome, %).
**Bottom tab bar** (só nesta tela): 4 abas — Grupo, Jogadores, Histórico, Ranking; ícone quadrado 18px com borda 2px, label 10.5px/600; ativo roxo, inativo `#9A97A5`; padding `8px 10px 22px`, `border-top` e fundo `rgba(255,255,255,.92)` com blur.

### 4. Jogadores
Header com voltar + "Jogadores" + "14 ativos". Busca 42px `#EFEDE7` com ícone lupa. Aviso roxo (`#F4F1FF`, texto `#5A28E8`, ícone estrela): "As estrelas só aparecem pra organizadores". Lista: avatar 38px pill com iniciais (cor por jogador), nome 15.5px/500, estrelas `★`+`½` 13.5px `#FFB300`, `⋯` 18px; divisor `1px #EFEDE7`. Rodapé fixo: "+ Novo jogador" preto 52px.

### 5. Novo jogador
Header "Novo jogador" + "Nome e nível. 5 segundos.".
- Avatar 66px preenchido com a cor escolhida + iniciais 22px/700; ao lado, 6 swatches 24px (`#7C4DFF #FF6A1F #00A86B #2B7FFF #FF4D96 #FFB300`), selecionado com `box-shadow: 0 0 0 2px #15141A`.
- Campo Nome: 54px, borda 1.5px `#7C4DFF`, texto 17px + caret piscando 2px×22px.
- Nível: 5 estrelas 34px clicáveis (base `#E6E4DE`, preenchimento `#FFB300` por clip de largura — 100% / 50% / 0%), rótulo "3,5 de 5" em Archivo 118%/700. Toggle "Meia estrela" (subtrai 0,5 do valor escolhido; indisponível em 1 estrela, hint "a partir de 2 estrelas" / "meio ponto abaixo").
- Aviso roxo: "O nível é usado só pra equilibrar o sorteio. Ninguém mais vê."
- Toggle "Só pra hoje (avulso)" com sub-label "não entra na lista fixa do grupo".
- Rodapé: "Salvar jogador" roxo 54px.

Regras: nome obrigatório; nível 1–5 em passos de 0,5 (default 2,5 = 3 estrelas com meia ligada); avulso não entra na lista fixa do grupo.

### 6. Nova partida (configuração)
Chip "Usando o preset da última terça" (`#F4F1FF`). **Esporte:** chips 999px com ícone de traço 15px — Vôlei (ativo: preto/branco), Futsal, Basquete, Beach tennis (outline `#DFDCD4`). **Formato:** dois cards steppers (Times = 2, Por time = 6) com `−`/`+` circulares 26px e número Archivo 22px/800. **Pontuação:** segmented `#EFEDE7` com 3 opções (Sets ativo branco, Tempo, Livre). Card de regras com 4 linhas: Pontos por set `25`, Vantagem de 2 (toggle roxo ligado), Melhor de `3 sets`, Tiebreak `15`. Rodapé: "Quem veio hoje?" roxo.

### 7. Check-in
Header com título + subtítulo "Marca quem tá na quadra" e, à direita, contador vivo Archivo 26px/800 roxo + "presentes". Busca 42px. Linhas tocáveis (raio 14px): presente = fundo branco + borda `#E6E4DE`, avatar opaco, check `✓` branco em círculo 24px `#00A86B`; ausente = fundo `#F7F6F3`, sem borda, avatar/estrelas `opacity .4`, nome `#A9A5B8`, círculo `#DFDCD4` vazio. Botão tracejado "+ Avulso" (→ Novo jogador). Rodapé: "Sorteia aí →" roxo.

### 8. Sorteio / Times
Header com "Times sorteados" + "Arrasta pra trocar de lado" e pill "Re-sortear" com ícone. Faixa de equilíbrio verde (`#EAFBF2`): "Equilíbrio ótimo · 23 ★ contra 22 ★" + "só admin vê".
Card por time (raio 20px): header no tint da cor com bolinha 22px, nome 17px/700, ícone de lápis (nome editável) e soma de estrelas à direita. Linhas de jogador: alça de arraste (3 traços 12px), nome, estrelas, ícone de pino (`#15141A` quando fixado, `#DFDCD4` quando não), `cursor: grab`.
**Som do time:** faixa escura `#15141A` dentro do card — círculo 30px na cor do time com ícone de alto-falante, nome do som + "toca a cada ponto", waveform de 7 barras 2.5px na cor do time, pill "trocar".
Banco tracejado: "Banco · quem ganha fica" + chips de nomes. Rodapé: "Começar partida" preto.
**Bottom sheet de som** (raio 24px topo): grab handle; "Som do Time Roxo" + "3 segundos. Toca a cada ponto."; bloco de gravação escuro com botão vermelho-rosa 52px (quadrado branco 16px = gravar) e "grita aí: 3… 2… 1…"; biblioteca com 4 itens (Buzina de ginásio, Torcida enlouquecida, Siuuu, Apito + vaia), cada um com play circular 26px, nome e tag.

### 9. Placar (landscape, a tela mais importante)
Fundo `#0B0A0F`, fullscreen, sem status bar, wake lock ligado.
Duas metades tocáveis (`flex: 1`) com gradiente da cor do time; cada uma: bolinha 9px + nome uppercase 17px/700 (+ badge "SAQUE" lima quando saca), número Archivo 168px/900 branco, e 3 bolinhas 10px de sets (ganhos na cor do time, resto `rgba(255,255,255,.18)`).
Divisor central `1px rgba(255,255,255,.10)`. Topo central: pill "3º SET" + "25-23 · 22-25" em Archivo 118%. Topo esquerdo: ponto `#FFC93C` pulsante + "sem internet · salvando no aparelho". Topo direito: cronômetro "00:42".
Barra de controles inferior (pill de vidro, `padding: 7px`, gap 7px): **Desfazer** branco 38px com ícone (hover lima; opacidade .45 quando a pilha está vazia), `−1 Roxo`, `−1 Laranja`, botão de inverter lados (ícone 38px), **Encerrar** em vermelho translúcido.
Comportamento: toque na metade = +1 e passa o saque para o time; debounce contra toque duplo; desfazer remove o último ponto da pilha; inverter lados troca placar, cores e saque; fim de set/partida detectado por 25 com vantagem de 2 (tiebreak 15) abre modal de confirmação + som de vitória.

### 10. Placar ao vivo — espectador (Fase 2, landscape)
Mesma composição do placar, **sem controles**. Pill "AO VIVO" no topo (fundo `rgba(242,53,44,.18)`, ponto `#F2352C` pulsante, label 11px/800 tracking .12em). Rodapé central: "Vôlei de terça · 3º set · só leitura" e a URL `racha.app/ao-vivo/tr9k`. Link público, sem login, atualizando em tempo real.

### 11. Resumo / fim de partida
Fundo `#15141A` com confete animado (22 peças 5–7px, cores da paleta, `rachaFall`). Eyebrow lima 11px/800 "DEU RUIM PRO TIME LARANJA"; título 34px/800 branco em duas linhas ("Roxo levou / o rachão"). Card de vidro (raio 22px, `rgba(255,255,255,.06)`, borda `.10`): times nas laterais com bolinha + nome, placar central Archivo 52px/900; três blocos de set (SET 1 `25-23`, SET 2 `22-25` em `#8C889B`, SET 3 `15-11`); rodapé com "62 min · 12 jogadores · 12 ago, 20h". Ações: "Compartilhar no grupo" lima 54px, depois "Salvar" (vidro) e "Revanche" (outline).

### 12. Card do resultado (compartilhamento)
Preview do card exportado como imagem 1080×1350: fundo `#15141A`, raio 24px, padding `26px 22px`. Topo: "Vôlei de terça · 12 ago" 11px/700 uppercase `#8C889B` + wordmark "Racha" com ponto roxo. Duas linhas de time (bolinha 12px, nome 22px/700, número Archivo 44px/900); o perdedor com `opacity .55`. Rodapé separado por `1px rgba(255,255,255,.10)`: sets "25-23 · 22-25 · 15-11" e "MVP: Kaká" em lima. Ações: "Enviar no WhatsApp" `#00A86B` 54px e "Salvar imagem" outline. Nota: "O card sai como imagem, 1080×1350."

### 13. Histórico
Header + "18 partidas". Linhas-card (raio 16px, borda `#E6E4DE`, hover borda `#C9C4E8`): coluna de data (dia Archivo 17px/800 + mês uppercase 10.5px), nomes dos times 14.5px/600 + meta "vôlei · 3 sets · 62 min", e o placar com bolinhas das cores dos dois times. Clique abre o detalhe.

### 14. Detalhe da partida
Header "Roxo 2 × 1 Laranja" 20px/800 + "12 ago · vôlei · 62 min". Card "Sets" com três blocos. Card "Corrida do placar · 3º set": SVG `viewBox="0 0 300 90"`, linha de base `#EFEDE7`, duas polilinhas de 13 pontos, `stroke-width 2.5`, `stroke-linejoin: round`, nas cores dos times. Dois cards de escalação lado a lado com bolinha + nome do time e a lista de jogadores 13.5px `#57545F`.

### 15. Ranking (Fase 2)
Header + "temporada 2026". Chips de destaque: "Kaká invicto há 5" (`#F4F1FF`/`#5A28E8`), "Maior lavada: 25×7" (`#FFF4E5`/`#B45309`). Pódio de 3 colunas alinhadas na base: avatar 44px, nome 13px/600, barra com raio `12px 12px 0 0` — 2º lugar 58px `#EFEDE7`, 1º 82px roxo com número branco, 3º 44px `#EFEDE7`. Tabela: header `#FAF9F6` com `# / Jogador / J / V / %`; linhas com posição, avatar 26px, nome, badge verde de sequência quando houver, e % em Archivo 112%/700.

### 16. Configurações do grupo
Seções com label uppercase: **Grupo** (Nome, Esporte padrão, Tema — "Do sistema"); **Convite** em card roxo `#F4F1FF` com a URL `racha.app/g/volei-terca` em campo branco e botão "Copiar" roxo, mais a nota "Quem abrir o link entra como membro."; **Organizadores** (Você — criador; Dedé — admin). No fim, bloco tracejado "Ver placar ao vivo (espectador)".

## Interações e comportamento

| Gatilho | Efeito |
|---|---|
| Toque na metade do placar | +1 ponto, empilha no undo, passa o saque, toca o som do time, pulso de escala |
| Desfazer | remove o último ponto (por time correto), some da pilha; visível sempre, esmaecido quando vazio |
| −1 Roxo / −1 Laranja | decrementa sem passar de 0 |
| Inverter lados | troca placar, cores, sets e saque entre as metades |
| Encerrar | confirmação → Resumo |
| Fim de set | detecção automática (25 com vantagem de 2; tiebreak 15) → modal + som de vitória |
| Linha do check-in | alterna presente/ausente; contador do header atualiza na hora |
| Re-sortear | refaz os times mantendo jogadores fixados (pino) |
| Arrastar jogador entre times | move o jogador e recalcula equilíbrio ao vivo |
| Swatch / estrela / toggles do Novo jogador | atualizam avatar, nível e flags imediatamente |
| Hover em cards | borda passa a `#7C4DFF` ou `#C9C4E8` |

Estados obrigatórios no app real: carregando (skeleton nas listas), vazio (Jogadores sem ninguém — estado caprichado incentivando cadastrar a galera), erro de permissão de microfone, offline (chip no placar), sincronizando.

## Estado

- **Sessão:** usuário Google, grupos do usuário, grupo ativo, papel (organizador/membro).
- **Grupo:** nome, esporte padrão, preset de configuração, lista de jogadores (nome, iniciais, cor, nível 1–5 em passos de 0,5, ativo, avulso), organizadores, token do link de convite.
- **Partida em andamento:** esporte, formato (times, jogadores por time), modo de pontuação e regras, presentes, times (nome, cor, jogadores, som), banco, sets fechados, pontos do set atual, saque, pilha de undo, flip de lados, cronômetro, timestamps.
- **Derivado:** contador de presentes, soma de estrelas por time, indicador de equilíbrio, detecção de fim de set/partida, ranking (jogos, vitórias, %, sequência), corrida do placar.
- **Persistência:** escrita otimista local (IndexedDB/Firestore offline) e sync automático; o placar precisa funcionar 100% sem rede.

## Assets

Nenhuma imagem. Ícones são SVG de traço inline (`stroke-width` 1.7–2.2, `linecap: round`), exceto o "G" do Google, que é o logo oficial colorido em 4 paths. Fontes vêm do Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Archivo:wdth,wght@62..125,400..900&display=swap" rel="stylesheet">
```

O som de comemoração é gravado no navegador (`MediaRecorder`, 3s, com contagem regressiva e preview) ou escolhido de uma biblioteca de sons prontos; **pré-carregar todos os sons no início da partida** para tocar sem latência no ponto.

## Arquivos

- `Racha - Protótipo.dc.html` — o protótipo completo (16 telas, índice de navegação à esquerda, device que rotaciona no placar).
- `support.js` — runtime necessário para abrir o protótipo no navegador. Não é código de produção.

## Fora de escopo neste protótipo

Fase 3 do brief: agendamento com RSVP, ajuste automático de estrelas por resultado (Elo leve), regras "sempre juntos / nunca juntos", financeiro do grupo.
