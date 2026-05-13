import type { JSX } from 'react'
import { useAppStore } from '../../stores/app'
import { roomCorners, wallPolygon, floorPolygon, toIso, type IsoPoint } from './IsoEngine'
import { getPalette } from './themeColors'

const WALL_H = 2.5
const BASEBOARD_H = 3
const BASEBOARD_H_LEFT = 3

export function IsoRoom({ cx, cz, width, depth, label }: {
  cx: number; cz: number; width: number; depth: number; label?: string
}) {
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)
  const [bl, br, fr, fl] = roomCorners(cx, cz, width, depth)

  const gradId = `floorGrad-${cx}-${cz}`
  const tileId = `tile-${cx}-${cz}`
  const winGradId = `winGrad-${cx}-${cz}`

  const wallTopY_back = bl.y - WALL_H * 50
  const wallTopY_left = bl.y - WALL_H * 50

  return (
    <g>
      <defs>
        {/* Floor gradient: woodDark fading in from one direction */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.woodDark} stopOpacity="0.08" />
          <stop offset="100%" stopColor={palette.floorFill} stopOpacity="0" />
        </linearGradient>

        {/* Tile checker pattern */}
        <pattern id={tileId} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
          <rect x="4" y="4" width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
        </pattern>

        {/* Window glass gradient (top-bright, bottom-dark) */}
        <linearGradient id={winGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.windowFill} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.windowFill} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* ---- BACK WALL ---- */}
      <polygon
        points={wallPolygon(bl, br, WALL_H)}
        fill={palette.wallFill} stroke={palette.wallStroke} strokeWidth="1.5"
        opacity={0.75}
      />
      {/* Back wall top highlight line */}
      <line
        x1={bl.x} y1={wallTopY_back}
        x2={br.x} y2={wallTopY_back}
        stroke="#ffffff" strokeWidth="1" opacity="0.05"
      />
      {/* Back wall baseboard */}
      <polygon
        points={`${bl.x},${bl.y} ${br.x},${br.y} ${br.x},${br.y - BASEBOARD_H} ${bl.x},${bl.y - BASEBOARD_H}`}
        fill={palette.woodDark} opacity={0.3}
      />

      {/* ---- LEFT WALL ---- */}
      <polygon
        points={wallPolygon(bl, fl, WALL_H)}
        fill={palette.wallFill2} stroke={palette.wallStroke} strokeWidth="1.5"
        opacity={0.55}
      />
      {/* Left wall top highlight line */}
      <line
        x1={bl.x} y1={wallTopY_left}
        x2={fl.x} y2={fl.y - WALL_H * 50}
        stroke="#ffffff" strokeWidth="1" opacity="0.05"
      />
      {/* Left wall baseboard */}
      <polygon
        points={`${bl.x},${bl.y} ${fl.x},${fl.y} ${fl.x},${fl.y - BASEBOARD_H_LEFT} ${bl.x},${bl.y - BASEBOARD_H_LEFT}`}
        fill={palette.woodDark} opacity={0.3}
      />

      {/* ---- FLOOR ---- */}
      {/* Base floor polygon */}
      <polygon
        points={floorPolygon([bl, br, fr, fl])}
        fill={palette.floorFill} stroke={palette.wallStroke} strokeWidth="1.5"
      />
      {/* Gradient overlay */}
      <polygon
        points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${gradId})`}
      />
      {/* Tile texture overlay */}
      <polygon
        points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${tileId})`}
      />

      {/* Grid: dot pattern instead of solid lines */}
      <FloorGrid cx={cx} cz={cz} width={width} depth={depth} color={palette.floorStroke} />

      {/* Room label */}
      {label && (
        <text
          x={(bl.x + fr.x) / 2} y={(bl.y + fr.y) / 2 + 5}
          textAnchor="middle" fontSize="11" fontFamily="system-ui"
          fill={palette.floorStroke} opacity={0.5}
        >
          {label}
        </text>
      )}

      {/* Window on back wall */}
      <WindowDecoration
        p1={bl} p2={br}
        palette={palette} theme={theme}
        gradId={winGradId}
      />

      {/* Wall art / picture frame on back wall (left side) */}
      <WallArt
        p1={bl} p2={br}
        palette={palette}
        offsetRatio={-0.25}
      />

      {/* Wall art / picture frame on left wall */}
      <WallArtLeft
        p1={bl} p2={fl}
        palette={palette}
      />
    </g>
  )
}

function FloorGrid({ cx, cz, width, depth, color }: {
  cx: number; cz: number; width: number; depth: number; color: string
}) {
  const lines: JSX.Element[] = []
  const step = 2
  for (let x = cx - width / 2 + step; x < cx + width / 2; x += step) {
    const a = toIso(x, cz - depth / 2)
    const b = toIso(x, cz + depth / 2)
    lines.push(
      <line key={`vx${x}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={color} strokeWidth="0.5" opacity={0.1}
        strokeDasharray="3 3" />
    )
  }
  for (let z = cz - depth / 2 + step; z < cz + depth / 2; z += step) {
    const a = toIso(cx - width / 2, z)
    const b = toIso(cx + width / 2, z)
    lines.push(
      <line key={`hz${z}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={color} strokeWidth="0.5" opacity={0.1}
        strokeDasharray="3 3" />
    )
  }
  return <g>{lines}</g>
}

function WindowDecoration({ p1, p2, palette, theme, gradId }: {
  p1: IsoPoint; p2: IsoPoint; palette: ReturnType<typeof getPalette>; theme: string; gradId: string
}) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const w = 40, h = 25
  const top = midY - h - 8

  return (
    <g>
      {/* Window glow (light theme only) */}
      {theme === 'light' && (
        <rect x={midX - w / 2 - 4} y={top - 4} width={w + 8} height={h + 8} rx="4"
          fill="#fef9c3" opacity="0.1" />
      )}

      {/* Window frame */}
      <rect x={midX - w / 2} y={top} width={w} height={h} rx="2"
        fill={`url(#${gradId})`} stroke={palette.windowStroke} strokeWidth="1.5" opacity={0.6} />

      {/* Cross muntins */}
      <line x1={midX} y1={top} x2={midX} y2={top + h}
        stroke={palette.windowStroke} strokeWidth="1" opacity={0.5} />
      <line x1={midX - w / 2} y1={top + h / 2} x2={midX + w / 2} y2={top + h / 2}
        stroke={palette.windowStroke} strokeWidth="1" opacity={0.5} />

      {/* Left curtain arc */}
      <path
        d={`M${midX - w / 2},${top} Q${midX - w / 2 - 6},${top + h * 0.4} ${midX - w / 2 + 2},${top + h}`}
        fill={palette.wallFill} opacity={0.3} stroke="none"
      />
      {/* Right curtain arc */}
      <path
        d={`M${midX + w / 2},${top} Q${midX + w / 2 + 6},${top + h * 0.4} ${midX + w / 2 - 2},${top + h}`}
        fill={palette.wallFill} opacity={0.3} stroke="none"
      />
    </g>
  )
}

function WallArt({ p1, p2, palette, offsetRatio }: {
  p1: IsoPoint; p2: IsoPoint; palette: ReturnType<typeof getPalette>; offsetRatio: number
}) {
  const posX = p1.x + (p2.x - p1.x) * (0.5 + offsetRatio)
  const posY = p1.y + (p2.y - p1.y) * (0.5 + offsetRatio)
  const artW = 16
  const artH = 12
  const top = posY - 55

  return (
    <g>
      {/* Frame */}
      <rect x={posX - artW / 2} y={top} width={artW} height={artH} rx="1"
        fill={palette.topFill} stroke={palette.wallStroke} strokeWidth="0.8" opacity={0.6} />
      {/* Inner "painting" content */}
      <rect x={posX - artW / 2 + 2} y={top + 2} width={artW - 4} height={artH - 4} rx="0.5"
        fill={palette.metalLight} opacity={0.15} />
    </g>
  )
}

function WallArtLeft({ p1, p2, palette }: {
  p1: IsoPoint; p2: IsoPoint; palette: ReturnType<typeof getPalette>
}) {
  const ratio = 0.4
  const posX = p1.x + (p2.x - p1.x) * ratio
  const posY = p1.y + (p2.y - p1.y) * ratio
  const artW = 12
  const artH = 16
  const top = posY - 55

  return (
    <g>
      {/* Frame */}
      <rect x={posX - artW / 2} y={top} width={artW} height={artH} rx="1"
        fill={palette.topFill} stroke={palette.wallStroke} strokeWidth="0.8" opacity={0.5} />
      {/* Inner content */}
      <rect x={posX - artW / 2 + 2} y={top + 2} width={artW - 4} height={artH - 4} rx="0.5"
        fill={palette.metalLight} opacity={0.12} />
    </g>
  )
}
