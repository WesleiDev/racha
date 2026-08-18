import type { DataAdapter } from './adapter'
import { firebaseConfig } from './firebaseConfig'
import { localAdapter } from './local'
import { firebaseAdapter } from './firebase'

/** true quando o Firebase está conectado (config colado em firebaseConfig.ts) */
export const hasCloud = firebaseConfig !== null

/** adapter ativo — o resto do app só conhece esta interface */
export const db: DataAdapter = hasCloud ? firebaseAdapter : localAdapter

export * from './types'
