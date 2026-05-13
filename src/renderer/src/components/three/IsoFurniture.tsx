import { toIso } from './IsoEngine'
import { useAppStore } from '../../stores/app'
import { getPalette } from './themeColors'

// Shared SVG defs for furniture gradients
// Render once inside the IsoScene <svg> element
export function FurnitureDefs() {
  return (
    <defs>
      <filter id="furniture-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>
    </defs>
  )
}

// --- IsoDesk: professional isometric desk with wood grain, drawers, edge highlights ---
export function IsoDesk({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

  const w = 30, depth = 8, h = 12
  const topY = -22
  const dx = 5

  const topPath = `M${-w / 2 + 3},${topY}
    L${w / 2 - 3},${topY} Q${w / 2},${topY} ${w / 2},${topY + 2}
    L${w / 2 + dx - 2},${topY + depth} Q${w / 2 + dx},${topY + depth} ${w / 2 + dx - 2},${topY + depth}
    L${-w / 2 + dx + 2},${topY + depth} Q${-w / 2 + dx},${topY + depth} ${-w / 2 + dx},${topY + depth - 2}
    L${-w / 2},${topY + 2} Q${-w / 2},${topY} ${-w / 2 + 3},${topY} Z`

  const drawer1Y = topY + depth + 3
  const drawer2Y = topY + depth + 7

  // Wood grain lines on top face (horizontal strokes following iso angle)
  const grainL = -w / 2 + 6
  const grainR = w / 2 - 2

  return (
    <g transform={`translate(${pos.x},${pos.y}) rotate(${rotation * 30})`}>
      {/* Ground shadow */}
      <ellipse cx="2" cy={topY + depth + h + 4} rx="22" ry="6"
        fill="rgba(0,0,0,0.08)" filter="url(#furniture-shadow)" />

      {/* Right face (shadow side) */}
      <polygon
        points={`${w / 2},${topY} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${w / 2},${topY + h}`}
        fill={palette.woodDark} stroke={palette.woodDark} strokeWidth="1" opacity="0.85"
      />

      {/* Front face */}
      <polygon
        points={`${-w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${-w / 2 + dx},${topY + depth + h}`}
        fill={palette.woodMid} stroke={palette.woodDark} strokeWidth="1"
      />

      {/* Front drawers */}
      <rect x={-w / 2 + dx + 3} y={drawer1Y} width={w - 8} height="3" rx="1"
        fill={palette.woodDark} opacity="0.6" />
      <circle cx={w / 2 + dx - 6} cy={drawer1Y + 1.5} r="1" fill={palette.metalLight} opacity="0.8" />
      <rect x={-w / 2 + dx + 3} y={drawer2Y} width={w - 8} height="3" rx="1"
        fill={palette.woodDark} opacity="0.6" />
      <circle cx={w / 2 + dx - 6} cy={drawer2Y + 1.5} r="1" fill={palette.metalLight} opacity="0.8" />

      {/* Top face */}
      <path d={topPath} fill={palette.woodLight} stroke={palette.woodDark} strokeWidth="1.5" />

      {/* Wood grain lines on top */}
      <line x1={grainL} y1={topY + 3} x2={grainR} y2={topY + 3}
        stroke={palette.woodDark} strokeWidth="0.7" opacity="0.12" />
      <line x1={grainL + dx / 2} y1={topY + depth / 2 - 1} x2={grainR + dx / 2} y2={topY + depth / 2 - 1}
        stroke={palette.woodDark} strokeWidth="0.7" opacity="0.12" />
      <line x1={grainL + dx - 1} y1={topY + depth - 3} x2={grainR + dx - 1} y2={topY + depth - 3}
        stroke={palette.woodDark} strokeWidth="0.7" opacity="0.12" />

      {/* Edge highlight: front edge of top face */}
      <line
        x1={-w / 2 + dx + 2} y1={topY + depth}
        x2={w / 2 + dx - 2} y2={topY + depth}
        stroke="white" strokeWidth="1" opacity="0.2"
      />
    </g>
  )
}

// --- IsoMonitor: thin bezel screen with gradient, code lines, screen glare, Y-stand ---
export function IsoMonitor({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

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

// --- IsoChair: five-star base with wheels, cushion, curved backrest ---
export function IsoChair({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

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

// --- IsoRoundTable: elliptical top with wood grain, side arc, center column, 3 feet ---
export function IsoRoundTable({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

  const topCY = -20
  const sideH = 8
  const rx = 20, ry = 10

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Ground shadow */}
      <ellipse cx="0" cy={topCY + ry + 22} rx="16" ry="5"
        fill="rgba(0,0,0,0.07)" filter="url(#furniture-shadow)" />

      {/* Center column */}
      <rect x="-3" y={topCY + ry - 2} width="6" height="14"
        fill={palette.woodMid} stroke={palette.woodDark} strokeWidth="0.5" />
      {/* 3 feet */}
      <line x1="0" y1={topCY + ry + 12} x2="-8" y2={topCY + ry + 18}
        stroke={palette.woodDark} strokeWidth="2" />
      <line x1="0" y1={topCY + ry + 12} x2="8" y2={topCY + ry + 18}
        stroke={palette.woodDark} strokeWidth="2" />
      <line x1="0" y1={topCY + ry + 12} x2="0" y2={topCY + ry + 19}
        stroke={palette.woodDark} strokeWidth="2" />

      {/* Side arc */}
      <path
        d={`M${rx},${topCY} A${rx},${ry} 0 0 1 ${-rx},${topCY}
           L${-rx},${topCY + sideH} A${rx},${ry} 0 0 0 ${rx},${topCY + sideH} Z`}
        fill={palette.woodDark} opacity="0.5"
      />

      {/* Top ellipse */}
      <ellipse cx="0" cy={topCY} rx={rx} ry={ry}
        fill={palette.woodLight} stroke={palette.woodDark} strokeWidth="1.5" />

      {/* Wood grain arcs */}
      <path d={`M${-rx * 0.5},${topCY - 2} A${rx * 0.5},${ry * 0.5} 0 0 1 ${rx * 0.5},${topCY - 2}`}
        fill="none" stroke={palette.woodDark} strokeWidth="0.7" opacity="0.1" />
      <path d={`M${-rx * 0.3},${topCY + 3} A${rx * 0.3},${ry * 0.3} 0 0 1 ${rx * 0.3},${topCY + 3}`}
        fill="none" stroke={palette.woodDark} strokeWidth="0.7" opacity="0.1" />

      {/* Edge highlight on top ellipse */}
      <path d={`M${-rx + 3},${topCY} A${rx},${ry} 0 0 0 ${rx - 3},${topCY}`}
        fill="none" stroke="white" strokeWidth="1" opacity="0.15" />
    </g>
  )
}

// --- IsoSofa: 3-face isometric with cushion depressions, armrests, back pillows, fabric texture ---
export function IsoSofa({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

  const w = 36, depth = 10, h = 14
  const topY = -18
  const dx = 6

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Ground shadow */}
      <ellipse cx="3" cy={topY + depth + h + 4} rx="24" ry="7"
        fill="rgba(0,0,0,0.08)" filter="url(#furniture-shadow)" />

      {/* Right face (shadow side) */}
      <polygon
        points={`${w / 2},${topY} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${w / 2},${topY + h}`}
        fill={palette.fabricShadow} stroke={palette.fabricShadow} strokeWidth="1" opacity="0.7"
      />

      {/* Front face */}
      <polygon
        points={`${-w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${-w / 2 + dx},${topY + depth + h}`}
        fill={palette.fabricShadow} stroke={palette.fabricShadow} strokeWidth="1" opacity="0.9"
      />

      {/* Fabric texture on front: subtle cross lines */}
      {[-3, 0, 3, 6].map((offY) => (
        <line key={`tex-${offY}`}
          x1={-w / 2 + dx + 3} y1={topY + depth + 3 + offY}
          x2={w / 2 + dx - 3} y2={topY + depth + 3 + offY}
          stroke={palette.fabricFill} strokeWidth="0.5" opacity="0.08" />
      ))}
      {[0, 6, 12, 18, 24].map((offX) => (
        <line key={`texv-${offX}`}
          x1={-w / 2 + dx + 3 + offX} y1={topY + depth + 3}
          x2={-w / 2 + dx + 3 + offX} y2={topY + depth + h - 2}
          stroke={palette.fabricFill} strokeWidth="0.5" opacity="0.08" />
      ))}

      {/* Top face - rounded */}
      <path
        d={`M${-w / 2 + 4},${topY}
            L${w / 2 - 4},${topY} Q${w / 2},${topY} ${w / 2},${topY + 3}
            L${w / 2 + dx - 3},${topY + depth} Q${w / 2 + dx},${topY + depth} ${w / 2 + dx - 3},${topY + depth}
            L${-w / 2 + dx + 3},${topY + depth} Q${-w / 2 + dx},${topY + depth} ${-w / 2 + dx},${topY + depth - 3}
            L${-w / 2},${topY + 3} Q${-w / 2},${topY} ${-w / 2 + 4},${topY} Z`}
        fill={palette.fabricFill} stroke={palette.fabricShadow} strokeWidth="1"
      />

      {/* Cushion depression lines */}
      <path d={`M${-w / 2 + 10},${topY + 2} Q${-w / 2 + 10 + dx / 2},${topY + depth / 2} ${-w / 2 + 10},${topY + depth - 2}`}
        fill="none" stroke={palette.fabricShadow} strokeWidth="0.8" opacity="0.15" />
      <path d={`M${w / 2 - 10},${topY + 2} Q${w / 2 - 10 + dx / 2},${topY + depth / 2} ${w / 2 - 10},${topY + depth - 2}`}
        fill="none" stroke={palette.fabricShadow} strokeWidth="0.8" opacity="0.15" />

      {/* Edge highlight: front edge of top face */}
      <line
        x1={-w / 2 + dx + 3} y1={topY + depth}
        x2={w / 2 + dx - 3} y2={topY + depth}
        stroke="white" strokeWidth="1" opacity="0.2"
      />

      {/* Armrests - curved */}
      <path d={`M${-w / 2 - 2},${topY + 4} Q${-w / 2 - 5},${topY + 8} ${-w / 2 - 2},${topY + depth + h - 4}`}
        fill="none" stroke={palette.fabricFill} strokeWidth="6" strokeLinecap="round" />
      <path d={`M${w / 2 + dx + 2},${topY + 4} Q${w / 2 + dx + 5},${topY + 8} ${w / 2 + dx + 2},${topY + depth + h - 4}`}
        fill="none" stroke={palette.fabricFill} strokeWidth="6" strokeLinecap="round" />

      {/* Back pillows */}
      <ellipse cx={-8} cy={topY + depth + 4} rx="6" ry="4"
        fill={palette.fabricFill} stroke={palette.fabricShadow} strokeWidth="0.5" opacity="0.7" />
      <ellipse cx={8} cy={topY + depth + 4} rx="6" ry="4"
        fill={palette.fabricFill} stroke={palette.fabricShadow} strokeWidth="0.5" opacity="0.7" />
    </g>
  )
}

// --- IsoPlant: trapezoidal pot with rim, soil, stems, leaves with radial gradients, leaf veins ---
export function IsoPlant({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

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

// --- IsoCoffeeTable: small 3-face table with legs, coffee cup with steam ---
export function IsoCoffeeTable({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)

  const w = 22, depth = 6, h = 8
  const topY = -10
  const dx = 4

  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Ground shadow */}
      <ellipse cx="2" cy={topY + depth + h + 7} rx="16" ry="5"
        fill="rgba(0,0,0,0.07)" filter="url(#furniture-shadow)" />

      {/* 4 legs */}
      <line x1={-w / 2 + 3} y1={topY + depth + h} x2={-w / 2 + 3} y2={topY + depth + h + 6}
        stroke={palette.woodDark} strokeWidth="2" />
      <line x1={-w / 2 + dx + 3} y1={topY + depth + h} x2={-w / 2 + dx + 3} y2={topY + depth + h + 6}
        stroke={palette.woodDark} strokeWidth="2" />
      <line x1={w / 2 - 3} y1={topY + h} x2={w / 2 - 3} y2={topY + h + 6}
        stroke={palette.woodDark} strokeWidth="2" />
      <line x1={w / 2 + dx - 3} y1={topY + depth + h} x2={w / 2 + dx - 3} y2={topY + depth + h + 6}
        stroke={palette.woodDark} strokeWidth="2" />

      {/* Right face */}
      <polygon
        points={`${w / 2},${topY} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${w / 2},${topY + h}`}
        fill={palette.woodDark} stroke={palette.woodDark} strokeWidth="1" opacity="0.85"
      />

      {/* Front face */}
      <polygon
        points={`${-w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth} ${w / 2 + dx},${topY + depth + h} ${-w / 2 + dx},${topY + depth + h}`}
        fill={palette.woodMid} stroke={palette.woodDark} strokeWidth="1"
      />

      {/* Top face */}
      <polygon
        points={`${-w / 2},${topY} ${w / 2},${topY} ${w / 2 + dx},${topY + depth} ${-w / 2 + dx},${topY + depth}`}
        fill={palette.woodLight} stroke={palette.woodDark} strokeWidth="1.5"
      />

      {/* Edge highlight: front edge of top face */}
      <line
        x1={-w / 2 + dx} y1={topY + depth}
        x2={w / 2 + dx} y2={topY + depth}
        stroke="white" strokeWidth="1" opacity="0.2"
      />

      {/* Coffee cup on top */}
      <rect x="1" y={topY - 5} width="4" height="5" rx="1.5"
        fill={palette.metalLight} stroke={palette.metalDark} strokeWidth="0.5" />
      {/* Cup opening */}
      <ellipse cx="3" cy={topY - 5} rx="2" ry="1" fill={palette.metalMid} />
      {/* Steam wavy lines */}
      <path d={`M2,${topY - 6} Q2.5,${topY - 9} 2,${topY - 11}`} fill="none"
        stroke={palette.screenGlow} strokeWidth="0.5" opacity="0.3" />
      <path d={`M4,${topY - 6} Q3.5,${topY - 8} 4,${topY - 10}`} fill="none"
        stroke={palette.screenGlow} strokeWidth="0.5" opacity="0.25" />
    </g>
  )
}
