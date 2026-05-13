import { toIso } from '../IsoEngine'
import { usePalette } from '../PaletteContext'

// --- IsoMonitor: thin bezel screen with gradient, code lines, screen glare, Y-stand ---
export function IsoMonitor({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const { palette } = usePalette()

  const gradId = `screenGrad-${x}-${z}`

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.metalDark} />
          <stop offset="100%" stopColor={palette.screenGlow} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="0" cy="-6" rx="8" ry="2.5"
        fill="rgba(0,0,0,0.07)" filter="url(#furniture-shadow)" />

      {/* Outer bezel */}
      <rect x="-13" y="-34" width="26" height="18" rx="2"
        fill={palette.metalDark} stroke={palette.metalDark} strokeWidth="1.5" />

      {/* Screen with gradient */}
      <rect x="-11" y="-32" width="22" height="14" rx="1"
        fill={`url(#${gradId})`} />

      {/* Code lines */}
      <line x1="-8" y1="-29" x2="2" y2="-29" stroke={palette.screenGlow} strokeWidth="1.5" opacity="0.5" />
      <line x1="-8" y1="-26" x2="6" y2="-26" stroke={palette.screenGlow} strokeWidth="1.5" opacity="0.35" />
      <line x1="-8" y1="-23" x2="-1" y2="-23" stroke={palette.screenGlow} strokeWidth="1.5" opacity="0.45" />
      <line x1="-4" y1="-20" x2="4" y2="-20" stroke={palette.screenGlow} strokeWidth="1.5" opacity="0.4" />

      {/* Screen glare (diagonal reflection) */}
      <line x1="-9" y1="-31" x2="-3" y2="-24" stroke="white" strokeWidth="2" opacity="0.1"
        strokeLinecap="round" />

      {/* Y-stand: vertical stem */}
      <line x1="0" y1="-16" x2="0" y2="-9" stroke={palette.metalMid} strokeWidth="2.5" />
      {/* Y-stand: base ellipse */}
      <ellipse cx="0" cy="-8" rx="6" ry="2" fill={palette.metalMid} stroke={palette.metalDark} strokeWidth="0.5" />
    </g>
  )
}
