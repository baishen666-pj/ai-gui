import { useMemo, useState, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore, type ProjectRoom, type TeamMember, type ApprovalRequest } from '../../stores/app'
import { AgentCharacter } from './AgentCharacter'
import { AgentInfoPanel } from './AgentInfoPanel'

interface MemberState {
  id: string
  name: string
  role: string
  color: string
  activity: 'idle' | 'working' | 'meeting' | 'walking' | 'submitting'
  position: [number, number, number]
  walking: { from: [number, number, number]; to: [number, number, number]; progress: number; speed: number; targetActivity: string } | null
}

const ROOM_WIDTH = 10
const ROOM_DEPTH = 8
const ROOM_GAP = 4
const BOSS_POSITION: [number, number, number] = [0, 0, -8]

const ROLE_COLORS: Record<string, string> = {
  boss: '#4F46E5',
  pm: '#F59E0B',
  developer: '#10B981',
  designer: '#EC4899',
  tester: '#3B82F6',
  worker: '#8B5CF6'
}

function buildMemberStates(rooms: ProjectRoom[], boss: MemberState | null): MemberState[] {
  const members: MemberState[] = []
  if (boss) members.push(boss)

  rooms.forEach((room, ri) => {
    const roomX = (ri % 2) * (ROOM_WIDTH + ROOM_GAP) - (ROOM_WIDTH + ROOM_GAP) / 2
    const roomZ = Math.floor(ri / 2) * (ROOM_DEPTH + ROOM_GAP) + 4

    room.members.forEach((m, mi) => {
      const col = mi % 3
      const row = Math.floor(mi / 3)
      members.push({
        id: m.id,
        name: m.name,
        role: m.role,
        color: ROLE_COLORS[m.role] || '#8B5CF6',
        activity: m.activity,
        position: [roomX - 2.5 + col * 2.5, 0, roomZ - 1.5 + row * 2],
        walking: null
      })
    })
  })

  return members
}

function RoomVisual({ room, index }: { room: ProjectRoom; index: number }) {
  const roomX = (index % 2) * (ROOM_WIDTH + ROOM_GAP) - (ROOM_WIDTH + ROOM_GAP) / 2
  const roomZ = Math.floor(index / 2) * (ROOM_DEPTH + ROOM_GAP) + 4
  const theme = useAppStore((s) => s.theme)

  const floorColor = theme === 'cyberpunk' ? '#1f0035' : theme === 'light' ? '#f4f4f5' : '#18181b'
  const wallColor = theme === 'cyberpunk' ? '#2d004d' : theme === 'light' ? '#e4e4e7' : '#27272a'
  const textColor = theme === 'cyberpunk' ? '#00ffd5' : theme === 'light' ? '#3f3f46' : '#a1a1aa'

  return (
    <group position={[roomX, 0, roomZ]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 1.5, -ROOM_DEPTH / 2]}>
        <planeGeometry args={[ROOM_WIDTH, 3]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.6} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-ROOM_WIDTH / 2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_DEPTH, 3]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.4} />
      </mesh>
      {/* Right wall */}
      <mesh position={[ROOM_WIDTH / 2, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM_DEPTH, 3]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.4} />
      </mesh>
      {/* Desks (simple representations) */}
      {room.members.filter((m) => m.role !== 'pm').slice(0, 4).map((m, i) => (
        <group key={m.id} position={[-2.5 + (i % 3) * 2.5, 0, -1.5 + Math.floor(i / 3) * 2]}>
          <mesh position={[0, 0.375, 0]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.6]} />
            <meshStandardMaterial color={wallColor} roughness={0.6} />
          </mesh>
          {/* Monitor */}
          <mesh position={[0, 0.65, -0.2]}>
            <boxGeometry args={[0.5, 0.35, 0.03]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        </group>
      ))}
      {/* Room label */}
      <mesh position={[0, 0.02, ROOM_DEPTH / 2 - 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
    </group>
  )
}

function BossDesk() {
  const theme = useAppStore((s) => s.theme)
  const deskColor = theme === 'cyberpunk' ? '#2d004d' : theme === 'light' ? '#d4d4d8' : '#3f3f46'

  return (
    <group position={[BOSS_POSITION[0], 0, BOSS_POSITION[2] - 1]}>
      <mesh position={[0, 0.375, 0]} castShadow>
        <boxGeometry args={[1.6, 0.05, 0.8]} />
        <meshStandardMaterial color={deskColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, -0.25]}>
        <boxGeometry args={[0.6, 0.4, 0.04]} />
        <meshStandardMaterial color="#1a1a2e" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

export function DynamicOfficeScene() {
  const projectRooms = useAppStore((s) => s.projectRooms)
  const approvalRequests = useAppStore((s) => s.approvalRequests)
  const respondApproval = useAppStore((s) => s.respondApproval)
  const updateMemberActivity = useAppStore((s) => s.updateMemberActivity)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [returnEffect, setReturnEffect] = useState<{ memberId: string; approved: boolean } | null>(null)

  const pendingApproval = approvalRequests.find((r) => r.status === 'pending')
  const lastRespondedIdRef = useRef<string | null>(null)
  const deskPositionsRef = useRef<Map<string, [number, number, number]>>(new Map())

  const bossState = useMemo((): MemberState => ({
    id: 'boss',
    name: '老板',
    role: 'boss',
    color: '#4F46E5',
    activity: 'idle',
    position: BOSS_POSITION,
    walking: null
  }), [])

  const membersRef = useRef<MemberState[]>([])
  const lastCycleRef = useRef(0)
  const cycleIndexRef = useRef(0)

  const initialMembers = useMemo(
    () => buildMemberStates(projectRooms, bossState),
    [projectRooms, bossState]
  )

  if (membersRef.current.length === 0 || membersRef.current.length !== initialMembers.length) {
    membersRef.current = initialMembers.map((m) => ({ ...m }))
  }

  // Handle approval submission + return animation
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const members = membersRef.current
    const delta = state.clock.getDelta()

    // Trigger walking for submitting member
    if (pendingApproval) {
      lastRespondedIdRef.current = null
      const submitter = members.find((m) => m.id === pendingApproval.fromMemberId)
      if (submitter && !submitter.walking && submitter.activity !== 'submitting') {
        // Save desk position before walking to boss
        deskPositionsRef.current.set(submitter.id, [...submitter.position] as [number, number, number])
        submitter.walking = {
          from: [...submitter.position] as [number, number, number],
          to: [BOSS_POSITION[0] + 1.2, 0, BOSS_POSITION[2] + 0.5],
          progress: 0,
          speed: 0.3,
          targetActivity: 'submitting'
        }
        submitter.activity = 'walking'
      }
    }

    // Detect approval response and trigger return walk
    const responded = approvalRequests.find(
      (r) => r.status !== 'pending' && r.id !== lastRespondedIdRef.current
    )
    if (responded) {
      lastRespondedIdRef.current = responded.id
      const returner = members.find((m) => m.id === responded.fromMemberId)
      if (returner && !returner.walking) {
        const deskPos = deskPositionsRef.current.get(returner.id)
        if (deskPos) {
          returner.walking = {
            from: [...returner.position] as [number, number, number],
            to: deskPos,
            progress: 0,
            speed: 0.35,
            targetActivity: responded.status === 'approved' ? 'working' : 'idle'
          }
          returner.activity = 'walking'
          setReturnEffect({ memberId: returner.id, approved: responded.status === 'approved' })
          // Clean up stored desk position after a delay
          setTimeout(() => deskPositionsRef.current.delete(returner.id), 3000)
        }
      }
    }

    // Activity cycling
    if (t - lastCycleRef.current > 8 && members.length > 1) {
      lastCycleRef.current = t
      const idx = (cycleIndexRef.current + 1) % members.length
      cycleIndexRef.current = idx
      const agent = members[idx]

      if (!agent.walking && agent.activity !== 'submitting') {
        const activities = ['idle', 'working', 'meeting'] as const
        agent.activity = activities[Math.floor(Math.random() * activities.length)]
      }
    }

    // Advance walking
    for (const agent of members) {
      if (!agent.walking) continue
      const w = agent.walking
      w.progress += delta * w.speed

      const ease = w.progress < 0.5
        ? 2 * w.progress * w.progress
        : 1 - Math.pow(-2 * w.progress + 2, 2) / 2

      agent.position[0] = w.from[0] + (w.to[0] - w.from[0]) * ease
      agent.position[2] = w.from[2] + (w.to[2] - w.from[2]) * ease

      if (w.progress >= 1) {
        agent.position = [...w.to] as [number, number, number]
        agent.activity = w.targetActivity as MemberState['activity']
        agent.walking = null
        // Clear return effect when member arrives back
        if (returnEffect && returnEffect.memberId === agent.id) {
          setTimeout(() => setReturnEffect(null), 800)
        }
      }
    }
  })

  const members = membersRef.current
  const selectedAgent = members.find((m) => m.id === selectedAgentId) ?? null

  return (
    <>
      {/* Central boss area */}
      <BossDesk />

      {/* Room visuals */}
      {projectRooms.map((room, i) => (
        <RoomVisual key={room.id} room={room} index={i} />
      ))}

      {/* All characters */}
      {members.map((member) => (
        <AgentCharacter
          key={member.id}
          agent={{
            id: member.id,
            name: member.name,
            color: member.color,
            activity: member.activity,
            slot: { position: member.position, rotation: 0 },
            walking: member.walking ? {
              fromPosition: member.walking.from,
              toSlot: { position: member.walking.to, rotation: 0 },
              targetActivity: member.walking.targetActivity as 'idle',
              progress: member.walking.progress,
              speed: member.walking.speed
            } : null
          }}
          onSelect={setSelectedAgentId}
        />
      ))}

      {selectedAgent && (
        <AgentInfoPanel
          agent={selectedAgent as any}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Approval indicator - glowing ring around boss when pending */}
      {pendingApproval && (
        <ApprovalGlowRing position={[BOSS_POSITION[0], 0.05, BOSS_POSITION[2]]} />
      )}

      {/* Return effect - color burst when member returns to desk */}
      {returnEffect && (() => {
        const member = members.find((m) => m.id === returnEffect.memberId)
        if (!member) return null
        return (
          <ReturnBurst
            position={member.position}
            approved={returnEffect.approved}
          />
        )
      })()}
    </>
  )
}

function ApprovalGlowRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1)
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.3
  })

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} transparent opacity={0.6} />
    </mesh>
  )
}

function ReturnBurst({ position, approved }: { position: [number, number, number]; approved: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const color = approved ? '#10b981' : '#ef4444'

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    // Rise and fade
    ref.current.position.y = Math.min((t % 2) * 0.5, 1.5)
    const scale = 1 + (t % 1) * 0.3
    ref.current.scale.setScalar(scale)
  })

  return (
    <group ref={ref} position={[position[0], 0.1, position[2]]}>
      {/* Vertical beam */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.15, 1, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
      </mesh>
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.4} side={2} />
      </mesh>
      {/* Floating checkmark or X */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}
