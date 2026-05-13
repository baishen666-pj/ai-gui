import { roomCorners, wallPolygon, floorPolygon } from './IsoEngine'
import { usePalette } from './PaletteContext'
import { FloorGrid } from './shared/FloorGrid'
import { WindowDecoration } from './shared/WindowDecoration'
import { WallArt } from './shared/WallArt'
import { RoomDefs } from './shared/RoomDefs'

const WALL_H = 2.5
const BASEBOARD_H = 3

export function IsoRoom({ cx, cz, width, depth, label }: {
  cx: number; cz: number; width: number; depth: number; label?: string
}) {
  const { palette, theme } = usePalette()
  const [bl, br, fr, fl] = roomCorners(cx, cz, width, depth)

  const gradId = `floorGrad-${cx}-${cz}`
  const tileId = `tile-${cx}-${cz}`
  const winGradId = `winGrad-${cx}-${cz}`

  const wallTopY = bl.y - WALL_H * 50

  return (
    <g>
      <RoomDefs gradId={gradId} tileId={tileId} winGradId={winGradId} palette={palette} />

      {/* ---- BACK WALL ---- */}
      <polygon
        points={wallPolygon(bl, br, WALL_H)}
        fill={palette.wallFill} stroke={palette.wallStroke} strokeWidth="1.5"
        opacity={0.75}
      />
      <line x1={bl.x} y1={wallTopY} x2={br.x} y2={wallTopY}
        stroke="#ffffff" strokeWidth="1" opacity="0.05" />
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
      <line x1={bl.x} y1={wallTopY} x2={fl.x} y2={fl.y - WALL_H * 50}
        stroke="#ffffff" strokeWidth="1" opacity="0.05" />
      <polygon
        points={`${bl.x},${bl.y} ${fl.x},${fl.y} ${fl.x},${fl.y - BASEBOARD_H} ${bl.x},${bl.y - BASEBOARD_H}`}
        fill={palette.woodDark} opacity={0.3}
      />

      {/* ---- FLOOR ---- */}
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={palette.floorFill} stroke={palette.wallStroke} strokeWidth="1.5" />
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${gradId})`} />
      <polygon points={floorPolygon([bl, br, fr, fl])}
        fill={`url(#${tileId})`} />

      <FloorGrid cx={cx} cz={cz} width={width} depth={depth} color={palette.floorStroke} />

      {/* Room label */}
      {label && (
        <text x={(bl.x + fr.x) / 2} y={(bl.y + fr.y) / 2 + 5}
          textAnchor="middle" fontSize="11" fontFamily="system-ui"
          fill={palette.floorStroke} opacity={0.5}>
          {label}
        </text>
      )}

      {/* Window on back wall */}
      <WindowDecoration p1={bl} p2={br} palette={palette} theme={theme} gradId={winGradId} />

      {/* Wall art on back wall (left side) */}
      <WallArt p1={bl} p2={br} palette={palette} offsetRatio={-0.25}
        artW={16} artH={12} yOffset={55} opacity={0.6} innerOpacity={0.15} />

      {/* Wall art on left wall */}
      <WallArt p1={bl} p2={fl} palette={palette} offsetRatio={-0.1}
        artW={12} artH={16} yOffset={55} opacity={0.5} innerOpacity={0.12} />
    </g>
  )
}
