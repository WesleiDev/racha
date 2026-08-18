export interface TeamColor {
  id: string
  name: string
  hex: string
  tint: string
}

/** paleta de 8 cores de time do handoff */
export const TEAM_COLORS: TeamColor[] = [
  { id: 'roxo', name: 'Roxo', hex: '#7C4DFF', tint: '#F4F1FF' },
  { id: 'laranja', name: 'Laranja', hex: '#FF6A1F', tint: '#FFF3EB' },
  { id: 'verde', name: 'Verde', hex: '#00A86B', tint: '#EAFAF2' },
  { id: 'azul', name: 'Azul', hex: '#2B7FFF', tint: '#EBF3FF' },
  { id: 'rosa', name: 'Rosa', hex: '#FF4D96', tint: '#FFEEF5' },
  { id: 'vermelho', name: 'Vermelho', hex: '#F2352C', tint: '#FEECEB' },
  { id: 'amarelo', name: 'Amarelo', hex: '#FFB300', tint: '#FFF6E0' },
  { id: 'preto', name: 'Preto', hex: '#23222A', tint: '#EDEDEF' },
]

export function teamColor(id: string): TeamColor {
  return TEAM_COLORS.find((c) => c.id === id) ?? TEAM_COLORS[0]
}

/** swatches de avatar do cadastro de jogador */
export const AVATAR_COLORS = ['#7C4DFF', '#FF6A1F', '#00A86B', '#2B7FFF', '#FF4D96', '#FFB300']

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}
