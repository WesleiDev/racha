# Racha 🏐

Sorteia os times, marca o placar, guarda a resenha.

App web (PWA, mobile-first) pra organizar partidas casuais de qualquer esporte — vôlei, futsal, basquete, beach tennis: cadastrar a galera, sortear times equilibrados por estrelas, marcar o placar na quadra (com som de comemoração gravado pelo time!) e guardar histórico e ranking do grupo.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produção em dist/
```

**Funciona 100% sem Firebase** (modo local: tudo no aparelho, via localStorage). Pra ligar login Google de verdade, sincronização entre aparelhos e placar ao vivo público, conecte o Firebase — leva 10 minutos: **ver [FIREBASE.md](FIREBASE.md)**.

## O que tem

- **Grupos** ("Vôlei de terça"): jogadores, partidas, ranking e link de convite próprios.
- **Jogadores com estrelas** (1–5, meia estrela): nível visível só pra organizadores.
- **Check-in** do dia + avulsos.
- **Sorteio equilibrado** (snake draft por estrelas) com drag & drop, fixar jogador (pino), re-sortear e banco ("quem ganha fica").
- **Som do time**: grava 3s no microfone ou escolhe da biblioteca (sintetizada, sem assets); toca a cada ponto.
- **Placar** landscape fullscreen: tela sempre acesa (wake lock), undo sempre à mão, sets com vantagem de 2 e tiebreak, saque, inverter lados, cronômetro pausável (modos tempo/livre), debounce de toque duplo, offline-first.
- **Resumo** com confete + **card 1080×1350** pra compartilhar no WhatsApp (com MVP).
- **Histórico** com corrida do placar (SVG) e escalações; **ranking** com pódio, sequência e maior lavada.
- **Placar ao vivo** pra espectador: `/ao-vivo/:token`, sem login (tempo real com Firebase; na mesma rede local funciona entre abas).
- **PWA**: instala na home, funciona offline.

## Stack

Vite + React 19 + TypeScript · Tailwind CSS 4 · zustand · @dnd-kit · Firebase (Auth Google + Firestore, offline-first) · vite-plugin-pwa

## Estrutura

```
src/
  data/       tipos + camada de persistência (adapter local ↔ firebase)
    firebaseConfig.ts   ← cole o config aqui pra conectar a nuvem
  lib/        sorteio, pontuação (event sourcing), áudio, card, wake lock
  state/      zustand: sessão, elenco, preparação, partida ao vivo
  components/ UI (tokens do design handoff), ícones, placar
  screens/    as 16 telas
design_handoff/   protótipo hifi de referência (abrir o .html no navegador)
firestore.rules   regras de segurança prontas pro deploy
```

A partida em andamento persiste a cada ponto: se o celular travar ou a página recarregar no meio do jogo, o placar volta exatamente de onde parou.
