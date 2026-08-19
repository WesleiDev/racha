import type { Match } from '../data/types'
import { teamColor } from './colors'
import { boardOf, allSets, usesSets } from './scoring'
import { fmtDay } from './format'

const W = 1080
const H = 1350

/** desenha o card 1080×1350 do resultado (mesma composição do handoff, escala 2.5×) */
export async function drawResultCard(
  canvas: HTMLCanvasElement,
  match: Match,
  groupName: string,
  mvpName?: string,
): Promise<void> {
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')!

  await document.fonts.load('800 55px "Bricolage Grotesque"').catch(() => {})
  await document.fonts.load('900 110px "Archivo"').catch(() => {})

  // fundo
  g.fillStyle = '#15141A'
  g.fillRect(0, 0, W, H)

  const pad = 66
  const board = boardOf(match)
  const sets = allSets(board)
  const scores = usesSets(match.config) ? board.setsWon : sets[sets.length - 1] ?? [0, 0]
  const winner = board.winner ?? (scores[0] === scores[1] ? -1 : scores.indexOf(Math.max(...scores)))

  // topo: eyebrow + wordmark
  g.textBaseline = 'alphabetic'
  g.fillStyle = '#8C889B'
  g.font = '700 30px "Bricolage Grotesque"'
  const eyebrow = `${groupName.toUpperCase()} · ${fmtDay(match.startedAt).toUpperCase()}`
  g.fillText(spaced(eyebrow, 0.08), pad, pad + 30)

  g.fillStyle = '#FFFFFF'
  g.font = '800 44px "Bricolage Grotesque"'
  const wm = 'TemJogo'
  const wmWidth = g.measureText(wm).width
  g.fillText(wm, W - pad - wmWidth - 26, pad + 36)
  g.fillStyle = '#7C4DFF'
  g.beginPath()
  g.arc(W - pad - 9, pad + 30, 9, 0, Math.PI * 2)
  g.fill()

  // linhas dos times
  const rows = match.teams.slice(0, 2)
  const rowY = [H * 0.36, H * 0.56]
  rows.forEach((team, i) => {
    const c = teamColor(team.colorId)
    const y = rowY[i]
    const lost = winner !== -1 && winner !== i
    g.globalAlpha = lost ? 0.55 : 1

    g.fillStyle = c.hex
    g.beginPath()
    g.arc(pad + 15, y - 20, 15, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = '#FFFFFF'
    g.font = '700 55px "Bricolage Grotesque"'
    g.fillText(team.name, pad + 56, y)

    g.font = '900 110px "Archivo"'
    const s = String(scores[i] ?? 0)
    const sw = g.measureText(s).width
    g.fillText(s, W - pad - sw, y + 18)
    g.globalAlpha = 1
  })

  // divisor
  g.strokeStyle = 'rgba(255,255,255,0.10)'
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(pad, H - 250)
  g.lineTo(W - pad, H - 250)
  g.stroke()

  // rodapé: sets + MVP
  g.fillStyle = '#A9A5B8'
  g.font = '600 36px "Bricolage Grotesque"'
  const setsTxt = sets.map((s) => `${s[0]}-${s[1]}`).join(' · ')
  g.fillText(setsTxt || '—', pad, H - 160)

  if (mvpName) {
    g.fillStyle = '#D6FF3F'
    g.font = '700 36px "Bricolage Grotesque"'
    const t = `MVP: ${mvpName}`
    const tw = g.measureText(t).width
    g.fillText(t, W - pad - tw, H - 160)
  }
}

function spaced(text: string, _tracking: number): string {
  return text.split('').join(' ')
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png')
  })
}

/** tenta Web Share com arquivo; senão baixa o PNG */
export async function shareCard(canvas: HTMLCanvasElement, text: string): Promise<'shared' | 'downloaded'> {
  const blob = await canvasToBlob(canvas)
  const file = new File([blob], 'temjogo-resultado.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch {
      /* usuário cancelou → cai pro download */
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'racha-resultado.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
