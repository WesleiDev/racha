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

Falta, se quiser 100%:

1. **`www.temjogo.app`** (hoje não responde): Hosting → adicionar domínio → `www.temjogo.app` como redirect pro principal, e criar o registro que ele pedir no DNS da Hostinger.
2. **`authDomain` no domínio próprio** — recomendado por causa do Safari/iPhone, que bloqueia armazenamento de terceiros e pode quebrar o login por redirect:
   - Google Cloud Console → **APIs e serviços → Credenciais** → cliente OAuth "Web client (auto created by Google Service)" → em **URIs de redirecionamento autorizados**, adicionar `https://temjogo.app/__/auth/handler` → salvar.
   - Só depois trocar `authDomain` pra `'temjogo.app'` em `src/data/firebaseConfig.ts`. **Se trocar antes, o login quebra** (`redirect_uri_mismatch`).
   - O handler já é servido no domínio (`https://temjogo.app/__/auth/handler` responde), então não precisa mexer em rewrite.
3. **Logo na tela de consentimento** (opcional): agora que o domínio existe, dá pra subir `public/logo-120.png` em Tela de permissão OAuth — o Google costuma pedir verificação de marca, que leva alguns dias.

## Cache do Hosting

`firebase.json` manda `no-cache` no HTML/sw.js e `immutable` de 1 ano nos assets com hash.
Detalhe que custou um bug: **no Hosting vale a última regra de header que casa** — por isso `/assets/**` fica depois do `**`.

## Notas

- **Plano Spark (gratuito) basta.** O áudio dos times vai em base64 dentro do Firestore (~40KB por som), então não usamos Cloud Storage e não precisa de cartão.
- **Custos em escala de grupo de amigos:** efetivamente zero — leitura/escrita do Firestore no free tier aguenta décadas de terças-feiras.
- As **regras** em `firestore.rules` garantem: só membros leem/escrevem no grupo; entrar pelo link só consegue se adicionar a si mesmo; placar ao vivo é público só pra leitura.
- O modelo de dados está em [`src/data/firebase.ts`](src/data/firebase.ts) (comentário no topo).
