import { useAppStore } from '../../stores/app'
import { roomCorners, wallPolygon, floorPolygon, toIso } from './IsoEngine'
import { IsoDesk, IsoMonitor, IsoChair, IsoPlant } from './IsoFurniture'

const BOSS_CX = 0
const BOSS_CZ = -8
const BOSS_W = 12
const BOSS_D = 10
const WALL_H = 3

export function IsoBossOffice() {
  const theme = useAppStore((s) => s.theme)
  const [bl, br, fr, fl] = roomCorners(BOSS_CX, BOSS_CZ, BOSS_W, BOSS_D)

  const floorFill = theme === 'cyberpunk' ? '#1f0035' : theme === 'light' ? '#fef3c7' : '#3f3f46'
  const wallFill = theme === 'cyberpunk' ? '#2d004d' : theme === 'light' ? '#fde68a' : '#4b5563'
  const wallFill2 = theme === 'cyberpunk' ? '#250048' : theme === 'light' ? '#fcd34d' : '#374151'
  const strokeColor = theme === 'cyberpunk' ? '#6b21a8' : theme === 'light' ? '#92400e' : '#6b7280'
  const labelColor = theme === 'cyberpunk' ? '#00ffd5' : theme === 'light' ? '#92400e' : '#fbbf24'

  return (
    <g>
      {/* Back wall */}
      <polygon points={wallPolygon(bl, br, WALL_H)}
        fill={wallFill} stroke={strokeColor} strokeWidth="2" opacity={0.7} />
      {/* Left wall */}
      <polygon points={wallPolygon(bl, fl, WALL_H)}
        fill={wallFill2} stroke={strokeColor} strokeWidth="2" opacity={0.5} />
      {/* Floor */}
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={floorFill} stroke={strokeColor} strokeWidth="2" />

      {/* Boss desk (larger) */}
      <g transform={`translate(${toIso(BOSS_CX, BOSS_CZ - 2).x},${toIso(BOSS_CX, BOSS_CZ - 2).y})`}>
        <polygon points="-20,-25 20,-25 25,-10 -15,-10" fill="#8b5a2b" stroke="#5c3a1a" strokeWidth="1.5" />
        <polygon points="-15,-10 25,-10 25,0 -15,0" fill="#6b4423" stroke="#5c3a1a" strokeWidth="1" />
        <polygon points="20,-25 25,-10 25,0 20,-15" fill="#7a5028" stroke="#5c3a1a" strokeWidth="1" />
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
        fill={labelColor} opacity={0.5}>
        老板办公室
      </text>

      {/* Double window on back wall */}
      <WindowDecoration p1={bl} p2={br} theme={theme} />
    </g>
  )
}

function WindowDecoration({ p1, p2, theme }: { p1: { x: number; y: number }; p2: { x: number; y: number }; theme: string }) {
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2
  const fill = theme === 'cyberpunk' ? '#3b0764' : theme === 'light' ? '#fef3c7' : '#1e3a5f'
  const frame = theme === 'cyberpunk' ? '#7c3aed' : theme === 'light' ? '#92400e' : '#475569'

  return (
    <g>
      <rect x={midX - 25} y={midY - 42} width="22" height="28" rx="2" fill={fill} stroke={frame} strokeWidth="1.5" opacity={0.6} />
      <rect x={midX + 3} y={midY - 42} width="22" height="28" rx="2" fill={fill} stroke={frame} strokeWidth="1.5" opacity={0.6} />
    </g>
  )
}

export const BOSS_POSITION = { x: BOSS_CX, z: BOSS_CZ } as const
