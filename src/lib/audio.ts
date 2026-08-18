import type { Team, TeamSound } from '../data/types'

export interface LibrarySound {
  id: string
  name: string
  tag: string
}

export const SOUND_LIBRARY: LibrarySound[] = [
  { id: 'buzina', name: 'Buzina de ginásio', tag: 'clássico' },
  { id: 'torcida', name: 'Torcida enlouquecida', tag: 'hype' },
  { id: 'siuuu', name: 'Siuuu', tag: 'lenda' },
  { id: 'apito', name: 'Apito + vaia', tag: 'zoeira' },
]

export const DEFAULT_SOUND: TeamSound = { kind: 'library', libraryId: 'buzina', name: 'Buzina de ginásio' }

let ctx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()

export function ensureCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/* ------------------------------------------------------------------ */
/* Síntese dos sons da biblioteca (placeholders 100% offline, sem asset) */
/* ------------------------------------------------------------------ */

const RATE = 44100

function offline(seconds: number): OfflineAudioContext {
  return new OfflineAudioContext(1, Math.ceil(RATE * seconds), RATE)
}

function noiseBuffer(o: OfflineAudioContext, seconds: number): AudioBuffer {
  const buf = o.createBuffer(1, Math.ceil(RATE * seconds), RATE)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

async function synthBuzina(): Promise<AudioBuffer> {
  const o = offline(1.5)
  const gain = o.createGain()
  gain.connect(o.destination)
  gain.gain.setValueAtTime(0, 0)
  gain.gain.linearRampToValueAtTime(0.5, 0.02)
  gain.gain.setValueAtTime(0.5, 1.1)
  gain.gain.exponentialRampToValueAtTime(0.001, 1.45)
  const lp = o.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 950
  lp.connect(gain)
  for (const f of [172, 176, 344]) {
    const osc = o.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = f
    osc.connect(lp)
    osc.start(0)
    osc.stop(1.45)
  }
  return o.startRendering()
}

async function synthTorcida(): Promise<AudioBuffer> {
  const o = offline(2.2)
  const src = o.createBufferSource()
  src.buffer = noiseBuffer(o, 2.2)
  const bp = o.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(500, 0)
  bp.frequency.linearRampToValueAtTime(1400, 0.6)
  bp.frequency.linearRampToValueAtTime(900, 2.2)
  bp.Q.value = 0.6
  const gain = o.createGain()
  gain.gain.setValueAtTime(0.02, 0)
  gain.gain.linearRampToValueAtTime(0.65, 0.5)
  gain.gain.setValueAtTime(0.6, 1.6)
  gain.gain.linearRampToValueAtTime(0.001, 2.2)
  src.connect(bp).connect(gain).connect(o.destination)
  src.start(0)
  // palmas por cima
  for (let t = 0.25; t < 2; t += 0.16 + Math.random() * 0.08) {
    const clap = o.createBufferSource()
    clap.buffer = noiseBuffer(o, 0.05)
    const cg = o.createGain()
    cg.gain.setValueAtTime(0.25, t)
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    const hp = o.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800
    clap.connect(hp).connect(cg).connect(o.destination)
    clap.start(t)
  }
  return o.startRendering()
}

async function synthSiuuu(): Promise<AudioBuffer> {
  const o = offline(1.5)
  // assobio deslizante "siuuu"
  const osc = o.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1400, 0)
  osc.frequency.linearRampToValueAtTime(2200, 0.35)
  osc.frequency.setValueAtTime(2200, 0.45)
  osc.frequency.exponentialRampToValueAtTime(650, 1.3)
  const vib = o.createOscillator()
  vib.frequency.value = 9
  const vibGain = o.createGain()
  vibGain.gain.value = 28
  vib.connect(vibGain).connect(osc.frequency)
  const gain = o.createGain()
  gain.gain.setValueAtTime(0, 0)
  gain.gain.linearRampToValueAtTime(0.4, 0.08)
  gain.gain.setValueAtTime(0.4, 1.0)
  gain.gain.exponentialRampToValueAtTime(0.001, 1.45)
  // sopro
  const breath = o.createBufferSource()
  breath.buffer = noiseBuffer(o, 1.5)
  const bp = o.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2600
  bp.Q.value = 1.2
  const bg = o.createGain()
  bg.gain.value = 0.06
  breath.connect(bp).connect(bg).connect(o.destination)
  osc.connect(gain).connect(o.destination)
  osc.start(0)
  osc.stop(1.45)
  vib.start(0)
  vib.stop(1.45)
  breath.start(0)
  return o.startRendering()
}

async function synthApito(): Promise<AudioBuffer> {
  const o = offline(1.6)
  // dois silvos de apito
  for (const t of [0, 0.32]) {
    const osc = o.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 2350
    const trill = o.createOscillator()
    trill.frequency.value = 42
    const trillGain = o.createGain()
    trillGain.gain.value = 320
    trill.connect(trillGain).connect(osc.frequency)
    const g = o.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.015)
    g.gain.setValueAtTime(0.22, t + 0.2)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26)
    osc.connect(g).connect(o.destination)
    osc.start(t)
    osc.stop(t + 0.27)
    trill.start(t)
    trill.stop(t + 0.27)
  }
  // vaia grave descendo
  const boo = o.createBufferSource()
  boo.buffer = noiseBuffer(o, 0.9)
  const bp = o.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(420, 0.7)
  bp.frequency.linearRampToValueAtTime(240, 1.55)
  bp.Q.value = 2.2
  const bg = o.createGain()
  bg.gain.setValueAtTime(0.0, 0.7)
  bg.gain.linearRampToValueAtTime(0.55, 0.85)
  bg.gain.linearRampToValueAtTime(0.001, 1.55)
  boo.connect(bp).connect(bg).connect(o.destination)
  boo.start(0.7)
  return o.startRendering()
}

async function synthVitoria(): Promise<AudioBuffer> {
  const o = offline(1.3)
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    const t = i * 0.14
    const osc = o.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = f
    const g = o.createGain()
    const dur = i === notes.length - 1 ? 0.6 : 0.2
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.35, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g).connect(o.destination)
    osc.start(t)
    osc.stop(t + dur)
  })
  return o.startRendering()
}

const SYNTHS: Record<string, () => Promise<AudioBuffer>> = {
  buzina: synthBuzina,
  torcida: synthTorcida,
  siuuu: synthSiuuu,
  apito: synthApito,
  vitoria: synthVitoria,
}

async function libraryBuffer(id: string): Promise<AudioBuffer | null> {
  if (buffers.has(`lib:${id}`)) return buffers.get(`lib:${id}`)!
  const synth = SYNTHS[id]
  if (!synth) return null
  const buf = await synth()
  buffers.set(`lib:${id}`, buf)
  return buf
}

async function recordedBuffer(dataUrl: string): Promise<AudioBuffer | null> {
  const key = `rec:${dataUrl.slice(-32)}:${dataUrl.length}`
  if (buffers.has(key)) return buffers.get(key)!
  try {
    const res = await fetch(dataUrl)
    const raw = await res.arrayBuffer()
    const buf = await ensureCtx().decodeAudioData(raw)
    buffers.set(key, buf)
    return buf
  } catch {
    return null
  }
}

async function soundBuffer(sound: TeamSound): Promise<AudioBuffer | null> {
  return sound.kind === 'library' ? libraryBuffer(sound.libraryId) : recordedBuffer(sound.dataUrl)
}

/* ------------------------------------------------------------------ */
/* API pública                                                          */
/* ------------------------------------------------------------------ */

/** Pré-carrega e decodifica todos os sons no início da partida — ponto toca sem atraso. */
export async function preloadMatchSounds(teams: Team[]): Promise<void> {
  await Promise.all([...teams.map((t) => soundBuffer(t.sound)), libraryBuffer('vitoria')])
}

function playBuffer(buf: AudioBuffer | null, gainValue = 1): void {
  if (!buf) return
  const c = ensureCtx()
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.value = gainValue
  src.connect(g).connect(c.destination)
  src.start()
}

export async function playTeamSound(sound: TeamSound): Promise<void> {
  playBuffer(await soundBuffer(sound))
}

export async function playLibrary(id: string): Promise<void> {
  playBuffer(await libraryBuffer(id))
}

export async function playVictory(): Promise<void> {
  playBuffer(await libraryBuffer('vitoria'))
}

export async function playRecorded(dataUrl: string): Promise<void> {
  playBuffer(await recordedBuffer(dataUrl))
}

/* ------------------------------------------------------------------ */
/* Gravação de 3 segundos                                               */
/* ------------------------------------------------------------------ */

export interface Recorder {
  /** para a gravação antes dos 3s (o resultado ainda é entregue) */
  stop: () => void
  done: Promise<string>
}

export class MicPermissionError extends Error {}

/** Grava até `seconds` de áudio do microfone e devolve um dataURL (base64, cabe no Firestore). */
export async function recordClip(seconds = 3, onTick?: (remaining: number) => void): Promise<Recorder> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    throw new MicPermissionError('mic')
  }

  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
    MediaRecorder.isTypeSupported(m),
  )
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  let timer: ReturnType<typeof setInterval> | null = null
  let remaining = seconds

  const done = new Promise<string>((resolve, reject) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      if (timer) clearInterval(timer)
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('read'))
      reader.readAsDataURL(blob)
    }
    rec.onerror = () => reject(new Error('record'))
  })

  rec.start()
  onTick?.(remaining)
  timer = setInterval(() => {
    remaining -= 1
    onTick?.(remaining)
    if (remaining <= 0 && rec.state === 'recording') rec.stop()
  }, 1000)

  return {
    stop: () => {
      if (rec.state === 'recording') rec.stop()
    },
    done,
  }
}
