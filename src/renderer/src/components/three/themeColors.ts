// Theme-aware color system per Art Bible Section 4
// Each theme defines depth planes + atmosphere + material tones

export interface ThemePalette {
  // Depth planes (3-tone isometric shading)
  topFill: string    // lit surface
  leftFill: string   // mid surface
  rightFill: string  // shadow surface

  // Materials
  woodLight: string
  woodMid: string
  woodDark: string
  metalLight: string
  metalMid: string
  metalDark: string
  screenGlow: string
  fabricFill: string
  fabricShadow: string

  // Environment
  floorFill: string
  floorStroke: string
  wallFill: string
  wallFill2: string
  wallStroke: string
  windowFill: string
  windowStroke: string

  // Nature
  plantLight: string
  plantMid: string
  plantDark: string
  potFill: string
  potStroke: string

  // Character
  outline: string
  outlineW: string
  skin: string
  skinShadow: string

  // Effects
  shadowOpacity: string
  glowColor: string
}

export const DARK_PALETTE: ThemePalette = {
  topFill: '#3f3f46', leftFill: '#27272a', rightFill: '#1a1a1d',
  woodLight: '#8b7355', woodMid: '#6b5740', woodDark: '#5c4a32',
  metalLight: '#6b7280', metalMid: '#4b5563', metalDark: '#374151',
  screenGlow: '#2563eb', fabricFill: '#6366f1', fabricShadow: '#4f46e5',
  floorFill: '#27272a', floorStroke: '#3f3f46',
  wallFill: '#3f3f46', wallFill2: '#2d2d32', wallStroke: '#52525b',
  windowFill: '#1e3a5f', windowStroke: '#475569',
  plantLight: '#4ade80', plantMid: '#22c55e', plantDark: '#16a34a',
  potFill: '#92400e', potStroke: '#78350f',
  outline: '#18181b', outlineW: '1.5',
  skin: '#fce4b8', skinShadow: '#d4a56a',
  shadowOpacity: '0.2', glowColor: '#4ade80',
}

export const LIGHT_PALETTE: ThemePalette = {
  topFill: '#e4e4e7', leftFill: '#d4d4d8', rightFill: '#c4c4c8',
  woodLight: '#c4a882', woodMid: '#a0845c', woodDark: '#8b7355',
  metalLight: '#d1d5db', metalMid: '#b0b5bc', metalDark: '#9ca3af',
  screenGlow: '#3b82f6', fabricFill: '#818cf8', fabricShadow: '#6366f1',
  floorFill: '#f4f4f5', floorStroke: '#d4d4d8',
  wallFill: '#e4e4e7', wallFill2: '#d4d4d8', wallStroke: '#a1a1aa',
  windowFill: '#bfdbfe', windowStroke: '#93c5fd',
  plantLight: '#4ade80', plantMid: '#22c55e', plantDark: '#16a34a',
  potFill: '#a16207', potStroke: '#854d0e',
  outline: '#3f3f46', outlineW: '1.5',
  skin: '#fce4b8', skinShadow: '#d4a56a',
  shadowOpacity: '0.12', glowColor: '#22c55e',
}

export const CYBERPUNK_PALETTE: ThemePalette = {
  topFill: '#2d004d', leftFill: '#1f0035', rightFill: '#150025',
  woodLight: '#7c3aed', woodMid: '#6b3fa0', woodDark: '#5b21b6',
  metalLight: '#7c3aed', metalMid: '#6d28d9', metalDark: '#5b21b6',
  screenGlow: '#00ffd5', fabricFill: '#a855f7', fabricShadow: '#9333ea',
  floorFill: '#1f0035', floorStroke: '#4a0080',
  wallFill: '#2d004d', wallFill2: '#250048', wallStroke: '#6b21a8',
  windowFill: '#3b0764', windowStroke: '#7c3aed',
  plantLight: '#00ffd5', plantMid: '#06b6d4', plantDark: '#0891b2',
  potFill: '#581c87', potStroke: '#3b0764',
  outline: '#1a0033', outlineW: '1.5',
  skin: '#fce4b8', skinShadow: '#d4a56a',
  shadowOpacity: '0.25', glowColor: '#00ffd5',
}

const PALETTES: Record<string, ThemePalette> = {
  dark: DARK_PALETTE,
  light: LIGHT_PALETTE,
  cyberpunk: CYBERPUNK_PALETTE,
}

export function getPalette(theme: string): ThemePalette {
  return PALETTES[theme] ?? DARK_PALETTE
}
