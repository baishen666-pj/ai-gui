import { toIso } from '../IsoEngine'
import { usePalette } from '../PaletteContext'

// --- IsoDesk: professional isometric desk with wood grain, drawers, edge highlights ---
export function IsoDesk({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  const pos = toIso(x, z)
  const { palette } = usePalette()

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
