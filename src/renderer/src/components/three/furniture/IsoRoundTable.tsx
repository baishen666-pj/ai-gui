import { toIso } from '../IsoEngine'
import { usePalette } from '../PaletteContext'

// --- IsoRoundTable: elliptical top with wood grain, side arc, center column, 3 feet ---
export function IsoRoundTable({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  const { palette } = usePalette()

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
