/**
 * ─────────────────────────────────────────────────────────────
 *  Config do Firebase — projeto temjogo-5271a (conectado em 18/08/2026).
 *  Com este objeto preenchido o app usa Auth Google + Firestore;
 *  se voltar a `null`, cai pro modo 100% local (localStorage).
 *  Regras de segurança: firestore.rules (raiz). Guia: FIREBASE.md.
 * ─────────────────────────────────────────────────────────────
 */
export const firebaseConfig: {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  measurementId?: string
} | null = {
  apiKey: 'AIzaSyAqnlFTOHFKFO23SkeBMQwciaFhxvTu1GY',
  // domínio próprio: mantém o login na mesma origem do app — Safari/iPhone
  // bloqueiam armazenamento de terceiros e derrubariam o fluxo por redirect.
  // Exige https://temjogo.app/__/auth/handler nas URIs autorizadas do cliente OAuth.
  authDomain: 'temjogo.app',
  projectId: 'temjogo-5271a',
  storageBucket: 'temjogo-5271a.firebasestorage.app',
  messagingSenderId: '974874399622',
  appId: '1:974874399622:web:cbd1b0d42eeaa9a6ec1207',
  measurementId: 'G-RRQTKBHNRP',
}
