import { toIso } from './IsoEngine'

export function ApprovalGlow({ cx, cz }: { cx: number; cz: number }) {
  const pos = toIso(cx, cz)
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      <ellipse cx="0" cy="0" rx="50" ry="25" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.6">
        <animate attributeName="stroke-width" values="2;4;2" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
      </ellipse>
    </g>
  )
}

export function ReturnBurst({ x, z, approved }: { x: number; z: number; approved: boolean }) {
  const pos = toIso(x, z)
  const color = approved ? '#10b981' : '#ef4444'
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Vertical beam */}
      <line x1="0" y1="0" x2="0" y2="-40" stroke={color} strokeWidth="2" opacity="0.5">
        <animate attributeName="opacity" values="0.7;0" dur="0.8s" fill="freeze" />
      </line>
      {/* Ground ring */}
      <ellipse cx="0" cy="0" rx="15" ry="7" fill="none" stroke={color} strokeWidth="2" opacity="0.4">
        <animate attributeName="rx" values="15;25" dur="0.8s" fill="freeze" />
        <animate attributeName="ry" values="7;12" dur="0.8s" fill="freeze" />
        <animate attributeName="opacity" values="0.4;0" dur="0.8s" fill="freeze" />
      </ellipse>
      {/* Check or X */}
      {approved ? (
        <g transform="translate(0,-45)">
          <polyline points="-4,0 0,4 6,-4" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="opacity" values="1;0" dur="0.8s" fill="freeze" begin="0.2s" />
          </polyline>
        </g>
      ) : (
        <g transform="translate(0,-45)">
          <line x1="-4" y1="-4" x2="4" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0" dur="0.8s" fill="freeze" begin="0.2s" />
          </line>
          <line x1="4" y1="-4" x2="-4" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0" dur="0.8s" fill="freeze" begin="0.2s" />
          </line>
        </g>
      )}
      {/* Sparkles */}
      <circle cx="-8" cy="-30" r="2" fill={color}>
        <animate attributeName="opacity" values="0.8;0" dur="0.6s" fill="freeze" />
        <animate attributeName="cy" values="-30;-40" dur="0.6s" fill="freeze" />
      </circle>
      <circle cx="8" cy="-25" r="1.5" fill={color}>
        <animate attributeName="opacity" values="0.8;0" dur="0.7s" fill="freeze" />
        <animate attributeName="cy" values="-25;-38" dur="0.7s" fill="freeze" />
      </circle>
    </g>
  )
}

export function WalkTrail({ positions }: { positions: { x: number; z: number }[] }) {
  if (positions.length === 0) return null
  return (
    <g>
      {positions.map((p, i) => {
        const pos = toIso(p.x, p.z)
        const opacity = 0.15 * (1 - i / positions.length)
        return (
          <circle key={i} cx={pos.x} cy={pos.y} r="3"
            fill="#3b82f6" opacity={opacity} />
        )
      })}
    </g>
  )
}
