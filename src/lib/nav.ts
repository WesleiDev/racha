/** aceita só caminhos internos — evita `?depois=` mandar o usuário pra fora do app */
export function safePath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
