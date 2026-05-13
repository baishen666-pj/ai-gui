import type { JSX } from 'react'
import { useAppStore } from '../../stores/app'
import { roomCorners, wallPolygon, floorPolygon, toIso, type IsoPoint } from './IsoEngine'
import { IsoMonitor, IsoChair, IsoPlant } from './IsoFurniture'
import { getPalette } from './themeColors'

const BOSS_CX = 0
const BOSS_CZ = -8
const BOSS_W = 12
const BOSS_D = 10
const WALL_H = 3
const BASEBOARD_H = 5

const BOSS_FLOOR: Record<string, string> = {
  light: '#fef3c7',
  dark: '#3f3f46',
  cyberpunk: '#1f0035',
}

function getBossColors(palette: ReturnType<typeof getPalette>, theme: string) {
  return {
    floor: BOSS_FLOOR[theme] ?? palette.floorFill,
    wall: theme === 'light' ? '#fde68a' : palette.wallFill,
    wall2: theme === 'light' ? '#fcd34d' : palette.wallFill2,
    stroke: palette.wallStroke,
    label: palette.glowColor,
    whiteboard: palette.topFill,
    whiteboardStroke: palette.wallStroke,
  }
}

export function IsoBossOffice() {
  const theme = useAppStore((s) => s.theme)
  const palette = getPalette(theme)
  const boss = getBossColors(palette, theme)
  const [bl, br, fr, fl] = roomCorners(BOSS_CX, BOSS_CZ, BOSS_W, BOSS_D)

  const gradId = `bossFloorGrad`
  const tileId = `bossTile`
  const winGradId = `bossWinGrad`

  const wallTopY = bl.y - WALL_H * 50

  return (
    <g>
      <defs>
        {/* Boss floor gradient */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.woodDark} stopOpacity="0.08" />
          <stop offset="100%" stopColor={boss.floor} stopOpacity="0" />
        </linearGradient>

        {/* Tile checker pattern */}
        <pattern id={tileId} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
          <rect x="4" y="4" width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
        </pattern>

        {/* Window glass gradient */}
        <linearGradient id={winGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.windowFill} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.windowFill} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* ---- BACK WALL ---- */}
      <polygon points={wallPolygon(bl, br, WALL_H)}
        fill={boss.wall} stroke={boss.stroke} strokeWidth="2" opacity={0.7} />
      {/* Back wall top highlight */}
      <line x1={bl.x} y1={wallTopY} x2={br.x} y2={wallTopY}
        stroke="#ffffff" strokeWidth="1" opacity="0.05" />
      {/* Back wall baseboard (wider than normal rooms) */}
      <polygon
        points={`${bl.x},${bl.y} ${br.x},${br.y} ${br.x},${br.y - BASEBOARD_H} ${bl.x},${bl.y - BASEBOARD_H}`}
        fill={palette.woodDark} opacity={0.3}
      />

      {/* ---- LEFT WALL ---- */}
      <polygon points={wallPolygon(bl, fl, WALL_H)}
        fill={boss.wall2} stroke={boss.stroke} strokeWidth="2" opacity={0.5} />
      {/* Left wall top highlight */}
      <line x1={bl.x} y1={wallTopY} x2={fl.x} y2={fl.y - WALL_H * 50}
        stroke="#ffffff" strokeWidth="1" opacity="0.05" />
      {/* Left wall baseboard */}
      <polygon
        points={`${bl.x},${bl.y} ${fl.x},${fl.y} ${fl.x},${fl.y - BASEBOARD_H} ${bl.x},${bl.y - BASEBOARD_H}`}
        fill={palette.woodDark} opacity={0.3}
      />

      {/* ---- FLOOR ---- */}
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={boss.floor} stroke={boss.stroke} strokeWidth="2" />
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${gradId})`} />
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${tileId})`} />

      {/* Floor grid dots */}
      <BossFloorGrid color={palette.floorStroke} />

      {/* Whiteboard on back wall */}
      <Whiteboard p1={bl} p2={br} palette={palette} fillColor={boss.whiteboard} strokeColor={boss.whiteboardStroke} />

      {/* Company logo on back wall top */}
      <CompanyLogo p1={bl} p2={br} palette={palette} />

      {/* Wall art on left wall */}
      <BossWallArtLeft p1={bl} p2={fl} palette={palette} />

      {/* Boss desk shadow on floor */}
      <polygon
        points="-30,-14 30,-14 37,2 -23,2"
        fill={palette.woodDark} opacity={0.08}
        transform={`translate(${toIso(BOSS_CX, BOSS_CZ - 2).x},${toIso(BOSS_CX, BOSS_CZ - 2).y + 4})`}
      />

      {/* Boss desk (isometric 3-face) */}
      <g transform={`translate(${toIso(BOSS_CX, BOSS_CZ - 2).x},${toIso(BOSS_CX, BOSS_CZ - 2).y})`}>
        {/* Top face */}
        <polygon points="-28,-32 28,-32 35,-16 -21,-16"
          fill={palette.woodLight} stroke={palette.woodDark} strokeWidth="1.5" />
        {/* Top face edge highlight */}
        <line x1="-28" y1="-32" x2="28" y2="-32"
          stroke={palette.metalLight} strokeWidth="0.8" opacity={0.3} />

        {/* Front face */}
        <polygon points="-21,-16 35,-16 35,0 -21,0"
          fill={palette.woodMid} stroke={palette.woodDark} strokeWidth="1" />
        {/* Front face wood grain lines */}
        <line x1="-19" y1="-10" x2="33" y2="-10"
          stroke={palette.woodDark} strokeWidth="0.4" opacity={0.15} />
        <line x1="-19" y1="-5" x2="33" y2="-5"
          stroke={palette.woodDark} strokeWidth="0.4" opacity="0.1" />

        {/* Right face */}
        <polygon points="28,-32 35,-16 35,0 28,-16"
          fill={palette.woodDark} stroke={palette.woodDark} strokeWidth="1" />

        {/* Drawer detail on front face */}
        <rect x="-16" y="-12" width="22" height="8" rx="1"
          fill={palette.woodDark} stroke={palette.woodDark} strokeWidth="0.5" opacity={0.6} />
        <rect x="6" y="-12" width="22" height="8" rx="1"
          fill={palette.woodDark} stroke={palette.woodDark} strokeWidth="0.5" opacity={0.6} />
        {/* Drawer handles */}
        <line x1="-8" y1="-8" x2="-2" y2="-8" stroke={palette.metalLight} strokeWidth="1" />
        <line x1="14" y1="-8" x2="20" y2="-8" stroke={palette.metalLight} strokeWidth="1" />
      </g>

      {/* Boss monitor */}
      <IsoMonitor x={BOSS_CX} z={BOSS_CZ - 2.5} />

      {/* Boss chair */}
      <IsoChair x={BOSS_CX} z={BOSS_CZ} />

      {/* Decorative plants */}
      <IsoPlant x={BOSS_CX - 4} z={BOSS_CZ + 3} />
      <IsoPlant x={BOSS_CX + 4} z={BOSS_CZ + 3} />

      {/* Label */}
      <text x={(bl.x + fr.x) / 2} y={(bl.y + fr.y) / 2 + 8}
        textAnchor="middle" fontSize="10" fontFamily="system-ui" fontWeight="700"
        fill={boss.label} opacity={0.5}>
        老板办公室
      </text>

      {/* Double window on back wall */}
      <WindowDecoration p1={bl} p2={br} palette={palette} theme={theme} gradId={winGradId} />
    </g>
  )
}

function BossFloorGrid({ color }: { color: string }) {
  const lines: JSX.Element[] = []
  const step = 2
  const cx = BOSS_CX
  const cz = BOSS_CZ
  const hw = BOSS_W / 2
  const hd = BOSS_D / 2
  for (let x = cx - hw + step; x < cx + hw; x += step) {
    const a = toIso(x, cz - hd)
    const b = toIso(x, cz + hd)
    lines.push(
      <line key={`bvx${x}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={color} strokeWidth="0.5" opacity={0.1}
        strokeDasharray="3 3" />
    )
  }
  for (let z = cz - hd + step; z < cz + hd; z += step) {
    const a = toIso(cx - hw, z)
    const b = toIso(cx + hw, z)
    lines.push(
      <line key={`bhz${z}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={color} strokeWidth="0.5" opacity={0.1}
        strokeDasharray="3 3" />
    )
  }
  return <g>{lines}</g>
}

function Whiteboard({ p1, p2, palette, fillColor, strokeColor }: {
  p1: IsoPoint; p2: IsoPoint
  palette: ReturnType<typeof getPalette>; fillColor: string; strokeColor: string
}) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const wbW = 50, wbH = 30
  const top = midY - wbH - 30

  return (
    <g>
      {/* Whiteboard body */}
      <rect x={midX - wbW / 2} y={top} width={wbW} height={wbH} rx="2"
        fill={fillColor} stroke={strokeColor} strokeWidth="1.5" opacity={0.75} />

      {/* Simulated text lines */}
      <line x1={midX - wbW / 2 + 5} y1={top + 7} x2={midX + 10} y2={top + 7}
        stroke={palette.floorStroke} strokeWidth="1.5" opacity={0.4} />
      <line x1={midX - wbW / 2 + 5} y1={top + 12} x2={midX + 5} y2={top + 12}
        stroke={palette.floorStroke} strokeWidth="1.5" opacity={0.35} />
      <line x1={midX - wbW / 2 + 5} y1={top + 17} x2={midX + 12} y2={top + 17}
        stroke={palette.floorStroke} strokeWidth="1.5" opacity={0.3} />
      <line x1={midX - wbW / 2 + 5} y1={top + 22} x2={midX + 2} y2={top + 22}
        stroke={palette.floorStroke} strokeWidth="1.5" opacity={0.25} />

      {/* Mini chart rectangle */}
      <rect x={midX + 10} y={top + 7} width={wbW / 2 - 16} height={12} rx="1"
        fill={palette.metalLight} opacity={0.2} />

      {/* Tray at bottom */}
      <rect x={midX - 15} y={top + wbH} width="30" height="3" rx="1"
        fill={strokeColor} opacity={0.5} />
    </g>
  )
}

function CompanyLogo({ p1, p2, palette }: {
  p1: IsoPoint; p2: IsoPoint
  palette: ReturnType<typeof getPalette>
}) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const logoTop = midY - WALL_H * 50 + 5

  return (
    <g>
      {/* Logo background */}
      <rect x={midX - 10} y={logoTop} width="20" height="10" rx="2"
        fill={palette.glowColor} opacity={0.5} />
      {/* Inner geometric icon (diamond shape) */}
      <polygon
        points={`${midX},${logoTop + 2} ${midX + 4},${logoTop + 5} ${midX},${logoTop + 8} ${midX - 4},${logoTop + 5}`}
        fill={palette.topFill} opacity={0.6}
      />
    </g>
  )
}

function BossWallArtLeft({ p1, p2, palette }: {
  p1: IsoPoint; p2: IsoPoint
  palette: ReturnType<typeof getPalette>
}) {
  const ratio = 0.4
  const posX = p1.x + (p2.x - p1.x) * ratio
  const posY = p1.y + (p2.y - p1.y) * ratio
  const artW = 14
  const artH = 18
  const top = posY - 65

  return (
    <g>
      {/* Frame */}
      <rect x={posX - artW / 2} y={top} width={artW} height={artH} rx="1"
        fill={palette.topFill} stroke={palette.wallStroke} strokeWidth="0.8" opacity={0.5} />
      {/* Inner content */}
      <rect x={posX - artW / 2 + 2} y={top + 2} width={artW - 4} height={artH - 4} rx="0.5"
        fill={palette.metalLight} opacity={0.15} />
    </g>
  )
}

function WindowDecoration({ p1, p2, palette, theme, gradId }: {
  p1: IsoPoint; p2: IsoPoint; palette: ReturnType<typeof getPalette>; theme: string; gradId: string
}) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const top = midY - 42
  const winW = 22
  const winH = 28
  const gap = 6

  return (
    <g>
      {/* Window glow (light theme only) */}
      {theme === 'light' && (
        <rect x={midX - winW - gap / 2 - 4} y={top - 4}
          width={winW * 2 + gap + 8} height={winH + 8} rx="4"
          fill="#fef9c3" opacity="0.1" />
      )}

      {/* Left window */}
      <rect x={midX - winW - gap / 2} y={top} width={winW} height={winH} rx="2"
        fill={`url(#${gradId})`} stroke={palette.windowStroke} strokeWidth="1.5" opacity={0.6} />
      {/* Left window cross muntins */}
      <line x1={midX - gap / 2} y1={top} x2={midX - gap / 2} y2={top + winH}
        stroke={palette.windowStroke} strokeWidth="1" opacity={0.5} />
      <line x1={midX - winW - gap / 2} y1={top + winH / 2} x2={midX - gap / 2} y2={top + winH / 2}
        stroke={palette.windowStroke} strokeWidth="1" opacity={0.5} />

      {/* Right window */}
      <rect x={midX + gap / 2} y={top} width={winW} height={winH} rx="2"
        fill={`url(#${gradId})`} stroke={palette.windowStroke} strokeWidth="1.5" opacity={0.6} />
      {/* Right window cross muntins */}
      <line x1={midX + winW / 2 + gap / 2} y1={top} x2={midX + winW / 2 + gap / 2} y2={top + winH}
        stroke={palette.windowStroke} strokeWidth="1" opacity="0.5" />
      <line x1={midX + gap / 2} y1={top + winH / 2} x2={midX + winW + gap / 2} y2={top + winH / 2}
        stroke={palette.windowStroke} strokeWidth="1" opacity="0.5" />

      {/* Left outer curtain arc */}
      <path
        d={`M${midX - winW - gap / 2},${top} Q${midX - winW - gap / 2 - 7},${top + winH * 0.4} ${midX - winW - gap / 2 + 2},${top + winH}`}
        fill={palette.wallFill} opacity={0.3} stroke="none"
      />
      {/* Right outer curtain arc */}
      <path
        d={`M${midX + winW + gap / 2},${top} Q${midX + winW + gap / 2 + 7},${top + winH * 0.4} ${midX + winW + gap / 2 - 2},${top + winH}`}
        fill={palette.wallFill} opacity={0.3} stroke="none"
      />
      {/* Center curtain arcs (between windows) */}
      <path
        d={`M${midX - gap / 2},${top} Q${midX},${top + winH * 0.3} ${midX + gap / 2},${top}`}
        fill={palette.wallFill} opacity={0.2} stroke="none"
      />
    </g>
  )
}

export const BOSS_POSITION = { x: BOSS_CX, z: BOSS_CZ } as const
