# Racha (nome provisório) — Brief de produto para protótipo

**Objetivo deste documento:** servir de brief funcional para o desenho do protótipo de UI/UX. Foco em telas, fluxos, estados e tom visual — detalhes de implementação só onde afetam o design. Priorizar Fase 1 e as telas-chave da Fase 2 (ver seção 8).

---

## 1. O produto em uma frase

App web (PWA, mobile-first) para organizar partidas casuais de qualquer esporte — vôlei, futsal, basquete, beach tennis: cadastrar a galera, sortear times equilibrados, marcar o placar na quadra e guardar o histórico e os rankings do grupo.

**Contexto de uso real:** quadra, ginásio ou praia; celular ou tablet; muitas vezes sob sol forte, em pé, no meio do jogo, com internet ruim. Isso pede: botões grandes, pouco texto, alto contraste, respostas instantâneas.

**Tom:** divertido e informal — é o app da pelada/rachão entre amigos, não um app de federação esportiva. A "resenha" (zoeira, rivalidade saudável, rankings) é parte do produto.

## 2. Papéis

| Papel | O que faz |
|---|---|
| **Organizador** (admin do grupo) | Cadastra jogadores, cria partidas, faz check-in, sorteia times, controla o placar. **Persona principal — o app é desenhado pra ele.** |
| **Membro** | Participa das partidas, vê histórico e rankings. |
| **Espectador** (Fase 2) | Abre um link público do placar ao vivo. Só leitura, sem login. |

## 3. Conceitos centrais

- **Grupo:** a turma recorrente ("Vôlei de terça"). Tem seus próprios jogadores, partidas e ranking. Um usuário pode ter vários grupos, mas o caso comum é um só.
- **Jogador:** nome, avatar/foto opcional, nível em estrelas (1 a 5, com meias estrelas). **As estrelas são visíveis apenas para organizadores** — avaliar amigo publicamente é constrangedor.
- **Partida:** esporte + configuração + times + placar + resultado.
- **Time:** nome editável, cor, lista de jogadores e **som de comemoração** — áudio de 3s gravado na hora ou escolhido de uma biblioteca de sons prontos. Toca toda vez que o time pontua.

## 4. Fluxo principal (caminho feliz)

1. Organizador abre o grupo → toca em **"Nova partida"**
2. Escolhe esporte e configuração (jogadores por time, modo de pontuação)
3. **Check-in:** marca quem está presente hoje (+ adiciona avulsos)
4. **Sorteio:** o app monta times equilibrados pelas estrelas → organizador ajusta com drag & drop → define nomes, cores e sons dos times
5. **Placar:** tela cheia na quadra; cada ponto toca o som do time; sets fecham com som de vitória
6. **Fim:** resumo do resultado → salvar → compartilhar card no WhatsApp
7. Histórico e ranking do grupo são atualizados → assunto no grupo até a próxima partida

## 5. Telas

### 5.1 Login
- Uma tela: logo, tagline, botão único **"Entrar com Google"**. Zero fricção.

### 5.2 Home / Meus grupos
- Cartões de grupo: nome, esporte, nº de membros, resultado da última partida.
- Ações: criar grupo, entrar por link de convite.
- Caso comum (1 grupo só): a home praticamente encaminha direto pro grupo.

### 5.3 Grupo (dashboard)
- Header: nome do grupo, esporte padrão.
- **CTA primário gigante: "Nova partida"** — é a ação nº 1 do app.
- Última partida (placar), atalho para histórico completo.
- Mini-ranking (top 3) — Fase 2.
- Navegação para: Jogadores, Histórico, Configurações.

### 5.4 Jogadores
- Lista: avatar, nome, estrelas (visíveis só para admin).
- Cadastro rápido: nome + estrelas em 5 segundos. Editar, inativar.
- Estado vazio caprichado incentivando cadastrar a galera.

### 5.5 Nova partida (configuração)
- Esporte em chips com ícone: vôlei, futsal, basquete, beach tennis, outro.
- Nº de times e jogadores por time.
- Modo de pontuação:
  - **Sets** (vôlei): pontos por set (padrão 25, vantagem de 2), melhor de N sets, tiebreak (15) — editável.
  - **Tempo** (futsal/basquete): cronômetro com pausa.
  - **Livre:** primeiro a X pontos, ou contagem aberta.
- O grupo lembra a última configuração usada (preset).

### 5.6 Check-in (quem veio hoje)
- Lista de jogadores com toggle presente/ausente + contador vivo ("14 presentes").
- Busca; botão **"+ Avulso"** (cadastro relâmpago: nome + estrelas).
- CTA: **"Sortear times"**.

### 5.7 Sorteio / Times
- Um cartão/coluna por time: nome editável, cor, jogadores, **soma de estrelas do time** (só admin) e indicador de equilíbrio entre os times.
- **Drag & drop** de jogadores entre times, com o equilíbrio recalculando ao vivo.
- Botões: **"Re-sortear"**; fixar jogador num time (pino) para re-sortear só o resto.
- Sobras (número que não divide): banco / fila de "próximos" (quem ganha fica).
- **Som do time:** gravar 3s no microfone (com contagem regressiva e preview) ou escolher da biblioteca (buzina, torcida, "siuuu"…).
- CTA: **"Começar partida"**.

### 5.8 Placar — a tela mais importante do app
- **Landscape, fullscreen, fundo escuro, tela sempre acesa.**
- Duas metades tocáveis, cada uma na cor do time, com nome do time e **placar GIGANTE** (tipografia display/numérica, legível a 10 metros).
- Toque na metade = +1 ponto → animação de pulso + **toca o som do time**.
- Sets: marcadores de sets ganhos (bolinhas); indicador de saque (vôlei, opcional).
- Cronômetro central com play/pause (esportes por tempo).
- Barra de controles discreta: **desfazer (sempre visível)**, −1 ponto, inverter lados (times trocaram de quadra), pausar, encerrar.
- **Fim de set:** detecção automática (ex.: 25 com vantagem de 2) → modal de confirmação + som de vitória. Fim de partida idem, mais festivo.
- Proteções: debounce contra toque duplo; confirmação para encerrar.
- Indicador discreto de offline ("sem internet — salvando no aparelho").

### 5.9 Fim de partida / Resumo
- Placar final festivo (confete no vencedor), sets, duração, escalações.
- Ações: **Salvar**, **Compartilhar** (gera card-imagem bonito pro WhatsApp: placar, times, data, logo), **Revanche** (mantém times ou re-sorteia).

### 5.10 Histórico
- Lista por data: placar, nomes dos times, esporte.
- Detalhe da partida: sets, escalações, timeline de pontos (gráfico simples de "corrida" do placar).

### 5.11 Ranking / Estatísticas (Fase 2)
- Por jogador: jogos, vitórias, % de aproveitamento, sequência atual.
- Destaques divertidos: "invicto há 5 jogos", maior lavada, MVP votado pós-partida.

### 5.12 Placar ao vivo — espectador (Fase 2)
- Link público, sem login: mesmo visual do placar, somente leitura, atualizando em tempo real. Pra galera do banco acompanhar.

### 5.13 Configurações do grupo
- Nome, esporte padrão, **convite por link**, gerenciar organizadores.

## 6. Detalhes de UX que decidem o produto

- **Undo onipresente no placar** — alguém marca ponto errado nos primeiros 10 minutos de uso, sempre.
- **Tela nunca apaga** durante a partida (wake lock) + fullscreen.
- Alvos de toque grandes; uso em pé, com sol, suor e pressa.
- Sons pré-carregados no início da partida — o som toca **instantaneamente** no ponto, sem atraso.
- **Offline first:** tudo funciona sem internet e sincroniza sozinho depois (quadra tem sinal ruim).
- PWA instalável: ícone na home, splash, abre como app.

## 7. Direção visual (sugestão)

- Vibe **esportiva + divertida**: cores vibrantes, energia, movimento; ilustrações ou ícones de esportes com personalidade.
- **Placar:** dark, contraste máximo, números enormes estilo painel de ginásio.
- App geral: tema claro/escuro conforme o sistema.
- **Paleta de cores de time:** ~8 cores fortes e nomeadas (ex.: Laranja, Roxo, Verde…) usadas em times, placar e cards.
- Microcopy informal em PT-BR: "Bora jogar", "Sorteia aí", "Deu ruim pro Time Laranja".

## 8. Fases (escopo do protótipo)

| Fase | Conteúdo |
|---|---|
| **Fase 1 — MVP** | Login, grupo, jogadores com estrelas, nova partida, check-in, sorteio com ajustes, placar completo (undo, sets, sons), resumo, histórico simples |
| **Fase 2 — Diversão** | Gravação de som do time + biblioteca, card de compartilhamento WhatsApp, placar ao vivo (espectador), ranking/estatísticas, PWA polido |
| **Fase 3 — Profundidade** | Agendamento com RSVP ("vou/não vou"), ajuste automático de estrelas por resultados (Elo leve), regras "sempre juntos / nunca juntos", financeiro simples do grupo |

> **Para o protótipo: desenhar a Fase 1 completa + as telas-chave da Fase 2** (sorteio com som do time, card de compartilhamento e ranking). Fase 3 não precisa de telas agora.

## 9. Notas técnicas (contexto para o design)

- Web app (PWA) **sem backend próprio**: Firebase — login Google, Firestore (dados + tempo real + offline), Hosting.
- O placar ao vivo do espectador usa o tempo real nativo do Firestore — atualização instantânea é viável e barata.
- Áudio dos times: gravação de 3s via microfone do navegador, salvo junto aos dados do time.
