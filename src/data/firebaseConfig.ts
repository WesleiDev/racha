/**
 * ─────────────────────────────────────────────────────────────
 *  CONECTAR O FIREBASE = COLAR O CONFIG AQUI. SÓ ISSO.
 *
 *  1. console.firebase.google.com → criar projeto
 *  2. Authentication → ativar provedor Google
 *  3. Firestore Database → criar banco
 *  4. Configurações do projeto → Seus apps → app Web → copiar o
 *     objeto firebaseConfig e colar no lugar do `null` abaixo.
 *
 *  Detalhes e regras de segurança: ver FIREBASE.md na raiz.
 *  Enquanto for `null`, o app roda 100% local (localStorage).
 * ─────────────────────────────────────────────────────────────
 */
export const firebaseConfig: {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
} | null = null
