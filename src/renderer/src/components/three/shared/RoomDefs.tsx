import type { ThemePalette } from '../themeColors'

interface RoomDefsProps {
  gradId: string; tileId: string; winGradId?: string
  palette: ThemePalette; floorColor?: string
}

export function RoomDefs({ gradId, tileId, winGradId, palette, floorColor }: RoomDefsProps) {
  return (
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={palette.woodDark} stopOpacity="0.08" />
        <stop offset="100%" stopColor={floorColor ?? palette.floorFill} stopOpacity="0" />
      </linearGradient>
      <pattern id={tileId} width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
        <rect x="4" y="4" width="4" height="4" fill={palette.floorStroke} opacity="0.03" />
      </pattern>
      {winGradId && (
        <linearGradient id={winGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.windowFill} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.windowFill} stopOpacity="0.3" />
        </linearGradient>
      )}
    </defs>
  )
}
