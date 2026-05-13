import { toIso } from './IsoEngine'

export function IsoDesk({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  const pos = toIso(x, z)
  const w = 30, h = 18, depth = 8
  const topY = -22
  return (
    <g transform={`translate(${pos.x},${pos.y}) rotate(${rotation * 30})`}>
      {/* Top face */}
      <polygon points={`${-w / 2},${topY} ${w / 2},${topY} ${w / 2 + 5},${topY + depth} ${-w / 2 + 5},${topY + depth}`}
        fill="#8b7355" stroke="#5c4a32" strokeWidth="1.5" />
      {/* Front face */}
      <polygon points={`${-w / 2 + 5},${topY + depth} ${w / 2 + 5},${topY + depth} ${w / 2 + 5},${topY + depth + 12} ${-w / 2 + 5},${topY + depth + 12}`}
        fill="#6b5740" stroke="#5c4a32" strokeWidth="1" />
      {/* Right face */}
      <polygon points={`${w / 2},${topY} ${w / 2 + 5},${topY + depth} ${w / 2 + 5},${topY + depth + 12} ${w / 2},${topY + 12}`}
        fill="#7a6248" stroke="#5c4a32" strokeWidth="1" />
    </g>
  )
}

export function IsoMonitor({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Screen */}
      <rect x="-12" y="-32" width="24" height="16" rx="2"
        fill="#1a1a2e" stroke="#4a4a6a" strokeWidth="1" />
      {/* Screen glow */}
      <rect x="-10" y="-30" width="20" height="12" rx="1"
        fill="#2563eb" opacity="0.3" />
      {/* Stand */}
      <rect x="-2" y="-16" width="4" height="6" fill="#4a4a5a" />
      <rect x="-6" y="-10" width="12" height="2" rx="1" fill="#4a4a5a" />
    </g>
  )
}

export function IsoChair({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Seat */}
      <ellipse cx="0" cy="-6" rx="10" ry="5" fill="#6b7280" stroke="#4b5563" strokeWidth="1" />
      {/* Back */}
      <rect x="-8" y="-20" width="16" height="14" rx="3" fill="#6b7280" stroke="#4b5563" strokeWidth="1" />
    </g>
  )
}

export function IsoRoundTable({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Table top - octagonal approximation of circle */}
      <polygon points="0,-22 14,-17 18,-5 14,7 0,12 -14,7 -18,-5 -14,-17"
        fill="#a0845c" stroke="#6b5740" strokeWidth="1.5" />
      {/* Stem */}
      <rect x="-3" y="-5" width="6" height="10" fill="#6b5740" />
    </g>
  )
}

export function IsoSofa({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Seat cushion */}
      <ellipse cx="0" cy="-4" rx="18" ry="9" fill="#6366f1" stroke="#4f46e5" strokeWidth="1.5" opacity="0.8" />
      {/* Back */}
      <rect x="-20" y="-16" width="40" height="10" rx="4" fill="#4f46e5" stroke="#3730a3" strokeWidth="1" opacity="0.7" />
      {/* Arm left */}
      <ellipse cx="-18" cy="-8" rx="5" ry="6" fill="#6366f1" stroke="#4f46e5" strokeWidth="1" opacity="0.7" />
      {/* Arm right */}
      <ellipse cx="18" cy="-8" rx="5" ry="6" fill="#6366f1" stroke="#4f46e5" strokeWidth="1" opacity="0.7" />
    </g>
  )
}

export function IsoPlant({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Pot */}
      <rect x="-5" y="-8" width="10" height="8" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="1" />
      {/* Leaves */}
      <circle cx="0" cy="-18" r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" opacity="0.85" />
      <circle cx="-5" cy="-22" r="6" fill="#16a34a" stroke="#15803d" strokeWidth="1" opacity="0.8" />
      <circle cx="5" cy="-20" r="6" fill="#4ade80" stroke="#16a34a" strokeWidth="1" opacity="0.7" />
    </g>
  )
}

export function IsoCoffeeTable({ x, z }: { x: number; z: number }) {
  const pos = toIso(x, z)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Top */}
      <ellipse cx="0" cy="-8" rx="14" ry="7" fill="#a0845c" stroke="#6b5740" strokeWidth="1" />
      {/* Legs */}
      <line x1="-10" y1="-5" x2="-10" y2="4" stroke="#6b5740" strokeWidth="2" />
      <line x1="10" y1="-5" x2="10" y2="4" stroke="#6b5740" strokeWidth="2" />
    </g>
  )
}
