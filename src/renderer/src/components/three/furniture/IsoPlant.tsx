import { toIso } from '../IsoEngine'
import { usePalette } from '../PaletteContext'

// --- IsoPlant: trapezoidal pot with rim, soil, stems, leaves with radial gradients, leaf veins ---
export function IsoPlant({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const { palette } = usePalette()

  const gradId = `leafGrad-${x}-${z}`

  // Leaf positions: [cx, cy, rx, ry, angle] for organic variety
  const leaves = [
    { cx: 0, cy: -24, rx: 7, ry: 5 },
    { cx: -5, cy: -21, rx: 5, ry: 4 },
    { cx: 5, cy: -20, rx: 5, ry: 3.5 },
    { cx: -2, cy: -26, rx: 4, ry: 3 },
    { cx: 3, cy: -27, rx: 4, ry: 3 },
    { cx: -4, cy: -17, rx: 3.5, ry: 2.5 },
  ]

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor={palette.plantLight} />
          <stop offset="100%" stopColor={palette.plantMid} />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="0" cy="5" rx="8" ry="3"
        fill="rgba(0,0,0,0.07)" filter="url(#furniture-shadow)" />

      {/* Pot body (trapezoid) */}
      <path d="M-7,-8 L-5,2 L5,2 L7,-8 Z" fill={palette.potFill} stroke={palette.potStroke} strokeWidth="1" />

      {/* Pot rim (ellipse, slightly brighter) */}
      <ellipse cx="0" cy="-8" rx="7" ry="3" fill={palette.potFill} stroke={palette.potStroke} strokeWidth="0.8" />
      {/* Pot rim highlight */}
      <path d={`M-6,-8 A7,3 0 0 0 6,-8`} fill="none" stroke="white" strokeWidth="0.7" opacity="0.15" />

      {/* Soil inside pot */}
      <ellipse cx="0" cy="-8" rx="5.5" ry="2" fill={palette.potStroke} opacity="0.3" />

      {/* Stems */}
      <line x1="0" y1="-9" x2="0" y2="-22" stroke={palette.plantDark} strokeWidth="1.5" />
      <line x1="0" y1="-11" x2="-4" y2="-20" stroke={palette.plantDark} strokeWidth="1" />
      <line x1="0" y1="-11" x2="5" y2="-18" stroke={palette.plantDark} strokeWidth="1" />

      {/* Leaves with radial gradient */}
      {leaves.map((leaf, i) => (
        <ellipse key={`leaf-${i}`} cx={leaf.cx} cy={leaf.cy} rx={leaf.rx} ry={leaf.ry}
          fill={`url(#${gradId})`} opacity="0.85" />
      ))}

      {/* Leaf veins (center line per leaf) */}
      {leaves.map((leaf, i) => (
        <line key={`vein-${i}`}
          x1={leaf.cx - leaf.rx * 0.5} y1={leaf.cy}
          x2={leaf.cx + leaf.rx * 0.5} y2={leaf.cy}
          stroke={palette.plantDark} strokeWidth="0.4" opacity="0.15" />
      ))}
    </g>
  )
}
