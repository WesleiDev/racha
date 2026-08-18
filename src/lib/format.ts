const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function fmtDay(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function fmtDayTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getHours()}h`
}

export function fmtDayParts(ts: number): { day: string; month: string } {
  const d = new Date(ts)
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()].toUpperCase() }
}

export function fmtDuration(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60))
  return `${min} min`
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fmtStars(v: number): string {
  return v % 1 === 0 ? String(v) : String(v).replace('.', ',')
}

export function ordinalSet(n: number): string {
  return `${n}º SET`
}
