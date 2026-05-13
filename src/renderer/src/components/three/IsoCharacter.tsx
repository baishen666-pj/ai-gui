import type { TeamRole } from '../../stores/app'
import type { AgentActivity } from './types'
import { ACTIVITY_COLORS } from './constants'

interface Props {
  name: string
  role: TeamRole
  color: string
  activity: AgentActivity
  facing: 'left' | 'right'
  animT: number
  isWalking: boolean
  onClick?: () => void
}

const SKIN = '#fce4b8'
const SKIN_STROKE = '#d4a56a'
const OUTLINE = '#2a2a3a'
const OUTLINE_W = 1.5

export function IsoCharacter({ name, role, color, activity, facing, animT, isWalking, onClick }: Props) {
  const flip = facing === 'left' ? -1 : 1
  const bounceY = getBounce(activity, animT)
  const { leftArm, rightArm, leftLeg, rightLeg } = getLimbAngles(activity, animT)
  const expression = getExpression(activity)
  const actColor = ACTIVITY_COLORS[activity] || color

  return (
    <g
      transform={`scale(${flip},1)`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <ellipse cx="0" cy="78" rx="16" ry="6" fill="rgba(0,0,0,0.15)" />

      <g transform={`translate(0,${bounceY})`}>
        {/* Legs */}
        <g transform={`translate(-5,58) rotate(${leftLeg})`}>
          <rect x="-2.5" y="0" width="5" height="16" rx="2" fill="#374151" stroke={OUTLINE} strokeWidth="1" />
        </g>
        <g transform={`translate(5,58) rotate(${rightLeg})`}>
          <rect x="-2.5" y="0" width="5" height="16" rx="2" fill="#374151" stroke={OUTLINE} strokeWidth="1" />
        </g>

        {/* Body */}
        <rect x="-10" y="32" width="20" height="26" rx="4"
          fill={color} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        {/* Role outfit detail */}
        <RoleOutfit role={role} color={color} />

        {/* Left arm */}
        <g transform={`translate(-12,36) rotate(${leftArm})`}>
          <rect x="-3" y="0" width="6" height="16" rx="3" fill={color} stroke={OUTLINE} strokeWidth="1" />
          <circle cx="0" cy="17" r="3" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
        </g>
        {/* Right arm */}
        <g transform={`translate(12,36) rotate(${rightArm})`}>
          <rect x="-3" y="0" width="6" height="16" rx="3" fill={color} stroke={OUTLINE} strokeWidth="1" />
          <circle cx="0" cy="17" r="3" fill={SKIN} stroke={SKIN_STROKE} strokeWidth="0.5" />
          {/* Role accessory in right hand */}
          <RoleAccessory role={role} />
        </g>

        {/* Head */}
        <circle cx="0" cy="22" r="14" fill={SKIN} stroke={OUTLINE} strokeWidth={OUTLINE_W} />
        {/* Hair */}
        <RoleHair role={role} />
        {/* Face */}
        <Face expression={expression} animT={animT} />

        {/* Activity indicator ring */}
        <ellipse cx="0" cy="78" rx="12" ry="4"
          fill="none" stroke={actColor} strokeWidth="1.5" opacity={0.5} />
      </g>

      {/* Name label */}
      <text x="0" y="-6" textAnchor="middle" fontSize="7" fontFamily="system-ui" fontWeight="600"
        fill="#e4e4e7" stroke="#000000" strokeWidth="2" paintOrder="stroke">
        {name}
      </text>
    </g>
  )
}

function getBounce(activity: AgentActivity, t: number): number {
  switch (activity) {
    case 'idle': return Math.sin(t * 2.4) * 1.5
    case 'working': return 0
    case 'meeting': return Math.sin(t * 1.5) * 0.8
    case 'walking': return Math.abs(Math.sin(t * 12)) * 3
    case 'submitting': return Math.sin(t * 6) * 2
    default: return 0
  }
}

function getLimbAngles(activity: AgentActivity, t: number) {
  switch (activity) {
    case 'idle': return { leftArm: 5, rightArm: -5, leftLeg: 0, rightLeg: 0 }
    case 'working': return {
      leftArm: -40 + Math.sin(t * 5) * 8,
      rightArm: -40 + Math.sin(t * 5 + Math.PI) * 8,
      leftLeg: 0, rightLeg: 0
    }
    case 'meeting': return {
      leftArm: -25 + Math.sin(t * 2) * 10,
      rightArm: 5,
      leftLeg: 0, rightLeg: 0
    }
    case 'walking': return {
      leftArm: Math.sin(t * 12) * 25,
      rightArm: Math.sin(t * 12 + Math.PI) * 25,
      leftLeg: Math.sin(t * 12 + Math.PI) * 20,
      rightLeg: Math.sin(t * 12) * 20
    }
    case 'submitting': return {
      leftArm: -10,
      rightArm: -60,
      leftLeg: 0, rightLeg: 0
    }
    default: return { leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 }
  }
}

function getExpression(activity: AgentActivity): 'neutral' | 'focused' | 'happy' | 'worried' {
  switch (activity) {
    case 'working': return 'focused'
    case 'meeting': return 'happy'
    case 'submitting': return 'worried'
    default: return 'neutral'
  }
}

// Face with anime-style expressions
function Face({ expression, animT }: { expression: string; animT: number }) {
  const blink = Math.sin(animT * 0.8) > 0.97 // blink ~3% of the time

  const eyePath = blink ? 'M-5,20 L-2,20 M2,20 L5,20' : // blink = lines
    expression === 'focused' ? 'M-5,18 L-5,22 M5,18 L5,22' : // focused = narrow
    expression === 'worried' ? '' : '' // default handled below
    ''

  return (
    <g>
      {/* Eyes */}
      {blink ? (
        <>
          <line x1="-6" y1="21" x2="-2" y2="21" stroke={OUTLINE} strokeWidth="1.5" />
          <line x1="2" y1="21" x2="6" y2="21" stroke={OUTLINE} strokeWidth="1.5" />
        </>
      ) : (
        <>
          {/* Left eye */}
          <ellipse cx="-4" cy={expression === 'focused' ? '20' : '21'} rx="3" ry={expression === 'focused' ? '2' : '3'}
            fill="white" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="-3.5" cy="21" r="1.5" fill="#2a2a3a" />
          <circle cx="-3" cy="20.5" r="0.5" fill="white" />
          {/* Right eye */}
          <ellipse cx="4" cy={expression === 'focused' ? '20' : '21'} rx="3" ry={expression === 'focused' ? '2' : '3'}
            fill="white" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="4.5" cy="21" r="1.5" fill="#2a2a3a" />
          <circle cx="5" cy="20.5" r="0.5" fill="white" />
        </>
      )}

      {/* Mouth */}
      {expression === 'happy' && (
        <path d="M-3,26 Q0,29 3,26" fill="none" stroke={OUTLINE} strokeWidth="1" strokeLinecap="round" />
      )}
      {expression === 'worried' && (
        <path d="M-2,27 Q0,26 2,27" fill="none" stroke={OUTLINE} strokeWidth="1" strokeLinecap="round" />
      )}
      {expression === 'focused' && (
        <line x1="-2" y1="26" x2="2" y2="26" stroke={OUTLINE} strokeWidth="1" />
      )}
      {expression === 'neutral' && (
        <line x1="-1.5" y1="26" x2="1.5" y2="26" stroke={OUTLINE} strokeWidth="1" />
      )}

      {/* Cheek blush for happy */}
      {expression === 'happy' && (
        <>
          <circle cx="-8" cy="24" r="2" fill="#f9a8d4" opacity="0.4" />
          <circle cx="8" cy="24" r="2" fill="#f9a8d4" opacity="0.4" />
        </>
      )}
      {/* Sweat drop for worried */}
      {expression === 'worried' && (
        <ellipse cx="10" cy="17" rx="1.5" ry="2" fill="#60a5fa" opacity="0.6" />
      )}
    </g>
  )
}

// Role-specific hair
function RoleHair({ role }: { role: TeamRole }) {
  switch (role) {
    case 'boss':
      return (
        <g>
          {/* Slicked back */}
          <path d="M-12,16 Q-14,8 -8,10 Q-4,6 0,8 Q4,6 8,10 Q14,8 12,16"
            fill="#1a1a2e" stroke={OUTLINE} strokeWidth="1" />
        </g>
      )
    case 'pm':
      return (
        <g>
          {/* Neat short hair */}
          <path d="M-13,18 Q-14,10 -8,12 Q0,8 8,12 Q14,10 13,18" fill="#5b3a1a" stroke={OUTLINE} strokeWidth="1" />
          {/* Glasses */}
          <circle cx="-4" cy="21" r="4" fill="none" stroke="#64748b" strokeWidth="1" />
          <circle cx="4" cy="21" r="4" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="0" y1="21" x2="0" y2="21" stroke="#64748b" strokeWidth="1" />
        </g>
      )
    case 'developer':
      return (
        <g>
          {/* Messy hair + headphone band */}
          <path d="M-13,17 Q-15,6 -6,14 Q0,5 6,14 Q15,6 13,17" fill="#374151" stroke={OUTLINE} strokeWidth="1" />
          {/* Headphone band */}
          <path d="M-14,16 Q-16,6 0,4 Q16,6 14,16" fill="none" stroke="#6b7280" strokeWidth="2" />
        </g>
      )
    case 'designer':
      return (
        <g>
          {/* Longer hair */}
          <path d="M-14,20 Q-16,6 0,4 Q16,6 14,20" fill="#f472b6" stroke={OUTLINE} strokeWidth="1" />
          {/* Beret */}
          <ellipse cx="-2" cy="8" rx="10" ry="5" fill="#ec4899" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="-2" cy="5" r="2" fill="#db2777" />
        </g>
      )
    case 'tester':
      return (
        <g>
          {/* Short neat hair */}
          <path d="M-13,18 Q-13,10 0,9 Q13,10 13,18" fill="#92400e" stroke={OUTLINE} strokeWidth="1" />
        </g>
      )
    case 'worker':
      return (
        <g>
          {/* Hard hat */}
          <path d="M-14,16 Q-16,4 0,2 Q16,4 14,16" fill="#fbbf24" stroke={OUTLINE} strokeWidth="1.5" />
          <line x1="-12" y1="14" x2="12" y2="14" stroke="#f59e0b" strokeWidth="2" />
        </g>
      )
    default:
      return (
        <path d="M-13,18 Q-14,10 0,8 Q14,10 13,18" fill="#4b5563" stroke={OUTLINE} strokeWidth="1" />
      )
  }
}

// Role outfit details on body
function RoleOutfit({ role, color }: { role: TeamRole; color: string }) {
  switch (role) {
    case 'boss':
      return (
        <g>
          {/* Tie */}
          <polygon points="0,33 -2,45 0,52 2,45" fill="#dc2626" stroke={OUTLINE} strokeWidth="0.5" />
          {/* Collar */}
          <line x1="-6" y1="33" x2="0" y2="36" stroke="white" strokeWidth="1" />
          <line x1="6" y1="33" x2="0" y2="36" stroke="white" strokeWidth="1" />
        </g>
      )
    case 'pm':
      return (
        <g>
          {/* Collar */}
          <line x1="-4" y1="33" x2="0" y2="35" stroke="white" strokeWidth="1" />
          <line x1="4" y1="33" x2="0" y2="35" stroke="white" strokeWidth="1" />
        </g>
      )
    case 'developer':
      return (
        <g>
          {/* Hoodie strings */}
          <line x1="-2" y1="33" x2="-3" y2="40" stroke="white" strokeWidth="0.5" />
          <line x1="2" y1="33" x2="3" y2="40" stroke="white" strokeWidth="0.5" />
        </g>
      )
    default:
      return null
  }
}

// Role accessory held in right hand
function RoleAccessory({ role }: { role: TeamRole }) {
  switch (role) {
    case 'pm':
      return (
        <g transform="translate(0,18)">
          {/* Clipboard */}
          <rect x="-3" y="-6" width="6" height="10" rx="1" fill="#fbbf24" stroke={OUTLINE} strokeWidth="0.5" />
          <rect x="-2" y="-8" width="4" height="3" rx="0.5" fill="#60a5fa" stroke={OUTLINE} strokeWidth="0.5" />
        </g>
      )
    case 'tester':
      return (
        <g transform="translate(0,18)">
          {/* Magnifying glass */}
          <circle cx="0" cy="-4" r="4" fill="none" stroke="#64748b" strokeWidth="1" />
          <line x1="3" y1="-1" x2="6" y2="4" stroke="#64748b" strokeWidth="1.5" />
        </g>
      )
    case 'worker':
      return (
        <g transform="translate(0,18)">
          {/* Wrench */}
          <rect x="-1" y="-8" width="2" height="12" rx="1" fill="#9ca3af" stroke={OUTLINE} strokeWidth="0.5" />
          <circle cx="0" cy="-8" r="3" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        </g>
      )
    default:
      return null
  }
}
