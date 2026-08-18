import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

function I({ size = 18, color = 'currentColor', strokeWidth = 2, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none' }}
    >
      {children}
    </svg>
  )
}

export const IconBack = (p: IconProps) => (
  <I {...p}>
    <path d="M15 5l-7 7 7 7" />
  </I>
)

export const IconGear = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </I>
)

export const IconSearch = (p: IconProps) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </I>
)

export const IconPlus = (p: IconProps) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
)

export const IconDots = (p: IconProps) => (
  <I {...p} strokeWidth={2.6}>
    <path d="M5.5 12h0M12 12h0M18.5 12h0" />
  </I>
)

export const IconCheck = (p: IconProps) => (
  <I {...p} strokeWidth={2.4}>
    <path d="M4.5 12.5l5 5 10-11" />
  </I>
)

export const IconX = (p: IconProps) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
)

export const IconMic = (p: IconProps) => (
  <I {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </I>
)

export const IconSpeaker = (p: IconProps) => (
  <I {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
  </I>
)

export const IconPlay = (p: IconProps) => (
  <I {...p}>
    <path d="M8.5 5.5v13l10-6.5-10-6.5z" />
  </I>
)

export const IconPencil = (p: IconProps) => (
  <I {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" />
  </I>
)

export const IconPin = (p: IconProps & { filled?: boolean }) => (
  <svg
    width={p.size ?? 18}
    height={p.size ?? 18}
    viewBox="0 0 24 24"
    fill={p.filled ? p.color ?? 'currentColor' : 'none'}
    stroke={p.color ?? 'currentColor'}
    strokeWidth={p.strokeWidth ?? 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flex: 'none' }}
  >
    <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z" />
    <path d="M12 15v6" />
  </svg>
)

export const IconDrag = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <path d="M7 8h10M7 12h10M7 16h10" />
  </I>
)

export const IconUndo = (p: IconProps) => (
  <I {...p}>
    <path d="M8 5L4 9l4 4" />
    <path d="M4 9h9.5a6 6 0 1 1 0 12H9" />
  </I>
)

export const IconSwap = (p: IconProps) => (
  <I {...p}>
    <path d="M7 8h13M17 4l3.5 4L17 12" />
    <path d="M17 16H4M7 12l-3.5 4L7 20" />
  </I>
)

export const IconClock = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
)

export const IconShare = (p: IconProps) => (
  <I {...p}>
    <path d="M12 15V3.5M8 7l4-3.5L16 7" />
    <path d="M5 12v7.5h14V12" />
  </I>
)

export const IconDownload = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3.5V15M8 11.5l4 4 4-4" />
    <path d="M5 20.5h14" />
  </I>
)

export const IconLink = (p: IconProps) => (
  <I {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
  </I>
)

export const IconCopy = (p: IconProps) => (
  <I {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </I>
)

export const IconTrophy = (p: IconProps) => (
  <I {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 14v3M8.5 20.5h7M12 17v3.5" />
  </I>
)

export const IconFlame = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3.5c1 3-4.5 5-4.5 10a4.5 4.5 0 0 0 9 0c0-2-1-3.5-2-4.5 0 1.5-.8 2.3-1.5 2.5.5-2.5-.5-6-1-8z" />
  </I>
)

export const IconUsers = (p: IconProps) => (
  <I {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3.5 19.5c.5-3.5 2.8-5 5.5-5s5 1.5 5.5 5" />
    <path d="M15.5 5.5a3.5 3.5 0 0 1 0 6M17 14.8c2 .5 3.2 2 3.5 4.7" />
  </I>
)

export const IconLogout = (p: IconProps) => (
  <I {...p}>
    <path d="M9 4H5.5v16H9" />
    <path d="M14 8l4 4-4 4M18 12H9.5" />
  </I>
)

export const IconEye = (p: IconProps) => (
  <I {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </I>
)

export const IconArrowRight = (p: IconProps) => (
  <I {...p}>
    <path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5" />
  </I>
)

export const IconStop = (p: IconProps) => (
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" style={{ flex: 'none' }}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill={p.color ?? 'currentColor'} />
  </svg>
)

/* ---- esportes ---- */

export const IconVolei = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5c-1.5 3.5-1.5 7 0 8.5M12 12c-3 1.5-6.5 1.2-8.3-.5M12 12c2.5 2.5 6 3.5 8.3 2.8" />
  </I>
)

export const IconFutsal = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.2l3.6 2.6-1.4 4.2h-4.4l-1.4-4.2L12 8.2z" />
    <path d="M12 3.5v4.7M20.2 9.4l-4.6 1.4M17.2 19l-3-4M6.8 19l3-4M3.8 9.4l4.6 1.4" />
  </I>
)

export const IconBasquete = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17M3.5 12h17M6 6c3 2.5 3 9.5 0 12M18 6c-3 2.5-3 9.5 0 12" />
  </I>
)

export const IconBeach = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <ellipse cx="10.5" cy="9" rx="6" ry="6.8" transform="rotate(-40 10.5 9)" />
    <path d="M14.8 14.2l4 4.5M7 7.5c2 .8 5 .8 7-.5M6.5 11.5c2.5 1 6 .8 8.5-1" />
  </I>
)

export const IconOutro = (p: IconProps) => (
  <I {...p} strokeWidth={1.8}>
    <path d="M12 3.5l2 5.6 5.9.2-4.7 3.6 1.7 5.7-4.9-3.4-4.9 3.4 1.7-5.7L4.1 9.3l5.9-.2 2-5.6z" />
  </I>
)

export const SPORT_ICONS: Record<string, (p: IconProps) => ReactNode> = {
  volei: IconVolei,
  futsal: IconFutsal,
  basquete: IconBasquete,
  beach: IconBeach,
  outro: IconOutro,
}

/* ---- logo Google oficial (4 paths coloridos) ---- */

export const IconGoogle = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: 'none' }}>
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
)
