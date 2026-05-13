import { useAppStore } from '../../stores/app'
import { roomCorners, wallPolygon, floorPolygon, toIso, type IsoPoint } from './IsoEngine'

const WALL_H = 2.5

export function IsoRoom({ cx, cz, width, depth, label }: {
  cx: number; cz: number; width: number; depth: number; label?: string
}) {
  const theme = useAppStore((s) => s.theme)
  const [bl, br, fr, fl] = roomCorners(cx, cz, width, depth)

  const floorFill = theme === 'cyberpunk' ? '#1f0035' : theme === 'light' ? '#f4f4f5' : '#27272a'
  const wallFill = theme === 'cyberpunk' ? '#2d004d' : theme === 'light' ? '#e4e4e7' : '#3f3f46'
  const wallFill2 = theme === 'cyberpunk' ? '#250048' : theme === 'light' ? '#d4d4d8' : '#2d2d32'
  const strokeColor = theme === 'cyberpunk' ? '#6b21a8' : theme === 'light' ? '#a1a1aa' : '#52525b'
  const textColor = theme === 'cyberpunk' ? '#00ffd5' : theme === 'light' ? '#52525b' : '#a1a1aa'

  return (
    <g>
      {/* Back wall */}
      <polygon
        points={wallPolygon(bl, br, WALL_H)}
        fill={wallFill} stroke={strokeColor} strokeWidth="1.5"
        opacity={0.7}
      />
      {/* Left wall */}
      <polygon
        points={wallPolygon(bl, fl, WALL_H)}
        fill={wallFill2} stroke={strokeColor} strokeWidth="1.5"
        opacity={0.5}
      />
      {/* Floor */}
      <polygon
        points={floorPolygon([bl, br, fr, fl])}
        fill={floorFill} stroke={strokeColor} strokeWidth="1.5"
      />
      {/* Grid lines on floor */}
      <FloorGrid cx={cx} cz={cz} width={width} depth={depth} color={strokeColor} />
      {/* Room label */}
      {label && (
        <text
          x={(bl.x + fr.x) / 2} y={(bl.y + fr.y) / 2 + 5}
          textAnchor="middle" fontSize="11" fontFamily="system-ui"
          fill={textColor} opacity={0.6}
        >
          {label}
        </text>
      )}
      {/* Window on back wall */}
      <WindowDecoration p1={bl} p2={br} theme={theme} />
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
    lines.push(<line key={`vx${x}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="0.5" opacity={0.2} />)
  }
  for (let z = cz - depth / 2 + step; z < cz + depth / 2; z += step) {
    const a = toIso(cx - width / 2, z)
    const b = toIso(cx + width / 2, z)
    lines.push(<line key={`hz${z}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="0.5" opacity={0.2} />)
  }
  return <g>{lines}</g>
}

function WindowDecoration({ p1, p2, theme }: { p1: IsoPoint; p2: IsoPoint; theme: string }) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const w = 40, h = 25
  const fill = theme === 'cyberpunk' ? '#3b0764' : theme === 'light' ? '#bfdbfe' : '#1e3a5f'
  const frameStroke = theme === 'cyberpunk' ? '#7c3aed' : theme === 'light' ? '#93c5fd' : '#475569'

  return (
    <g>
      <rect x={midX - w / 2} y={midY - h - 8} width={w} height={h} rx="2"
        fill={fill} stroke={frameStroke} strokeWidth="1.5" opacity={0.6} />
      <line x1={midX} y1={midY - h - 8} x2={midX} y2={midY - 8}
        stroke={frameStroke} strokeWidth="1" opacity={0.4} />
    </g>
  )
}
