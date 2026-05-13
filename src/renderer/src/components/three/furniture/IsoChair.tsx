import { toIso } from '../IsoEngine'
import { usePalette } from '../PaletteContext'

// --- IsoChair: five-star base with wheels, cushion, curved backrest ---
export function IsoChair({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const { palette } = usePalette()

  const spokeLen = 7
  const cx = 0, cy = 2
  const spokeAngles = [0, 72, 144, 216, 288]
  const spokes = spokeAngles.map((deg) => {
    const rad = (deg * Math.PI) / 180
    return {
      x2: cx + Math.cos(rad) * spokeLen,
      y2: cy + Math.sin(rad) * spokeLen * 0.5,
    }
  })

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Ground shadow */}
      <ellipse cx="0" cy="5" rx="10" ry="4"
        fill="rgba(0,0,0,0.06)" filter="url(#furniture-shadow)" />

      {/* Five-star base spokes */}
      {spokes.map((s, i) => (
        <line key={`spoke-${i}`} x1={cx} y1={cy} x2={s.x2} y2={s.y2}
          stroke={palette.metalMid} strokeWidth="1.5" />
      ))}
      {/* Wheels */}
      {spokes.map((s, i) => (
        <circle key={`wheel-${i}`} cx={s.x2} cy={s.y2} r="1.5" fill={palette.metalDark} />
      ))}
      {/* Center gas cylinder */}
      <rect x="-1.5" y="-4" width="3" height="6" rx="1" fill={palette.metalMid} />
      <circle cx={cx} cy={cy} r="1.5" fill={palette.metalMid} />

      {/* Seat cushion */}
      <ellipse cx="0" cy="-6" rx="10" ry="5"
        fill={palette.fabricFill} stroke={palette.fabricShadow} strokeWidth="1" />
      {/* Seat seam */}
      <line x1="-5" y1="-6" x2="5" y2="-6" stroke={palette.fabricShadow} strokeWidth="0.7" opacity="0.2" />

      {/* Backrest */}
      <rect x="-9" y="-22" width="18" height="16" rx="5"
        fill={palette.fabricFill} stroke={palette.fabricShadow} strokeWidth="1" />
      {/* Backrest concave curve */}
      <path d="M-7,-14 Q0,-11 7,-14" fill="none" stroke={palette.fabricShadow} strokeWidth="0.8" opacity="0.4" />
      {/* Backrest edge highlight */}
      <path d="M-8,-21 Q0,-24 8,-21" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15"
        strokeLinecap="round" />
    </g>
  )
}
