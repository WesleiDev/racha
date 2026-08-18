# Conectar o Firebase (≈10 minutos)

O app roda 100% local sem isso. Conectar liga: login Google de verdade, dados sincronizados entre aparelhos (jogadores, partidas, histórico, áudios), convite por link funcionando pra outras pessoas e placar ao vivo público em tempo real.

**O que já foi migrado pro seu primeiro login:** tudo que você criou no modo local (grupos, jogadores, partidas, áudios) sobe automaticamente pra nuvem — ninguém perde nada.

## Passo 1 — Criar o projeto

1. [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto** (ex.: `temjogo-app`). Google Analytics pode desligar.

## Passo 2 — Ativar login Google

1. **Criação** → **Authentication** → **Vamos começar**
2. Aba **Sign-in method** → **Google** → ativar → salvar

## Passo 3 — Criar o Firestore

1. **Criação** → **Firestore Database** → **Criar banco de dados**
2. Região: `southamerica-east1` (São Paulo) · modo **produção**
3. Aba **Regras** → cole o conteúdo de [`firestore.rules`](firestore.rules) → **Publicar**

## Passo 4 — Registrar o app web e colar o config

1. ⚙️ **Configurações do projeto** → **Seus apps** → ícone **`</>`** (Web) → registrar (ex.: `temjogo`)
2. Copie o objeto `firebaseConfig` que aparece
3. Cole em [`src/data/firebaseConfig.ts`](src/data/firebaseConfig.ts), trocando o `null`:

```ts
export const firebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'temjogo-app.firebaseapp.com',
  projectId: 'temjogo-app',
  storageBucket: 'temjogo-app.firebasestorage.app',
  messagingSenderId: '…',
  appId: '1:…:web:…',
}
```

Pronto. `npm run dev` e o login Google já é real. **Nenhuma outra mudança de código é necessária** — o app troca sozinho do armazenamento local pro Firestore (com cache offline: a quadra sem sinal continua funcionando).

## Passo 5 — Publicar (Firebase Hosting)

```bash
npm run build
npx firebase-tools login
npx firebase-tools init hosting   # public: dist · SPA (rewrite p/ index.html): sim
npx firebase-tools deploy
```

Sai em `https://temjogo-app.web.app`. Depois, em **Authentication → Settings → Domínios autorizados**, confirme que o domínio do Hosting está na lista (o do próprio projeto já vem).

## Domínio próprio (temjogo.app)

Estado: **conectado e servindo** — HTTPS com HSTS, HTTP redireciona pra HTTPS, e o Firebase já adicionou `temjogo.app` aos domínios autorizados do Auth (login funciona pelo domínio).

Concluído:

- **`authDomain: 'temjogo.app'`** — o login roda na mesma origem do app (evita o bloqueio de armazenamento de terceiros do Safari/iPhone). Depende de `https://temjogo.app/__/auth/handler` estar nas **URIs de redirecionamento autorizados** do cliente OAuth (Google Cloud Console → Credenciais → "Web client (auto created by Google Service)"). Já está lá; se algum dia o login der `redirect_uri_mismatch`, é essa lista que quebrou.
- **`www.temjogo.app`** — DNS aponta pro Hosting; o certificado é emitido automaticamente (pode levar até 24h na primeira vez).

Opcional que ficou de fora:

- **Logo na tela de consentimento**: subir `public/logo-120.png` em Tela de permissão OAuth. O Google costuma exigir verificação de marca (alguns dias) — o nome "TemJogo" já aparece sem isso.
- **Analytics**: o `measurementId` está no config mas o app não inicializa o Analytics (nenhum rastreamento hoje).

## Cache do Hosting

`firebase.json` manda `no-cache` no HTML/sw.js e `immutable` de 1 ano nos assets com hash.
Detalhe que custou um bug: **no Hosting vale a última regra de header que casa** — por isso `/assets/**` fica depois do `**`.

## Notas

- **Plano Spark (gratuito) basta.** O áudio dos times vai em base64 dentro do Firestore (~40KB por som), então não usamos Cloud Storage e não precisa de cartão.
- **Custos em escala de grupo de amigos:** efetivamente zero — leitura/escrita do Firestore no free tier aguenta décadas de terças-feiras.
- As **regras** em `firestore.rules` garantem: só membros leem/escrevem no grupo; entrar pelo link só consegue se adicionar a si mesmo; placar ao vivo é público só pra leitura.
- O modelo de dados está em [`src/data/firebase.ts`](src/data/firebase.ts) (comentário no topo).
