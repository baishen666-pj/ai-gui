import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentOfficeState } from './types'
import { ACTIVITY_COLORS } from './constants'

interface AgentCharacterProps {
  agent: AgentOfficeState
  onSelect: (id: string) => void
}

const VEC3_UP = new THREE.Vector3(0, 1, 0)

export function AgentCharacter({ agent, onSelect }: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const bodyColor = agent.color
  const darkerColor = useMemo(() => darken(agent.color, 0.6), [agent.color])

  const startPose = useMemo(() => ({
    pos: new THREE.Vector3(agent.slot.position[0], 0, agent.slot.position[2]),
    rot: agent.slot.rotation
  }), []) // only on mount

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const group = groupRef.current
    if (!group) return

    // Position interpolation during walking
    if (agent.walking) {
      const w = agent.walking
      const p = Math.min(w.progress, 1)
      const eased = easeInOutCubic(p)

      const from = new THREE.Vector3(...w.fromPosition)
      const to = new THREE.Vector3(...w.toSlot.position)
      const current = new THREE.Vector3().lerpVectors(from, to, eased)

      // Bobbing while walking
      current.y = Math.abs(Math.sin(t * 8)) * 0.08

      group.position.set(current.x, current.y, current.z)

      // Face direction of movement
      const dir = new THREE.Vector3().subVectors(to, from)
      if (dir.length() > 0.1) {
        const angle = Math.atan2(dir.x, dir.z)
        group.rotation.y = angle
      }
    } else {
      // Static position at slot
      const yOff = (agent.activity === 'idle' || agent.activity === 'working' || agent.activity === 'meeting') ? -0.3 : 0
      group.position.set(agent.slot.position[0], yOff, agent.slot.position[2])
      group.rotation.y = agent.slot.rotation
    }

    // Animate body parts based on current activity
    const activity = agent.walking ? 'walking' : agent.activity
    animateActivity(t, activity, headRef, leftArmRef, rightArmRef, leftLegRef, rightLegRef)

    // Activity ring pulse
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = agent.activity === 'working'
        ? 0.4 + Math.sin(t * 3) * 0.2
        : 0.3
      mat.color.set(ACTIVITY_COLORS[agent.activity] ?? '#71717a')
    }
  })

  return (
    <group
      ref={groupRef}
      position={[startPose.pos.x, startPose.pos.y, startPose.pos.z]}
      rotation={[0, startPose.rot, 0]}
      onPointerOver={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(agent.id)
      }}
      scale={hovered ? 1.05 : 1}
    >
      {/* Body */}
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.18, 0.5, 8, 16]} />
        <meshStandardMaterial
          color={darkerColor}
          emissive={bodyColor}
          emissiveIntensity={hovered ? 0.5 : 0.15}
          roughness={0.7}
        />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={bodyColor}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.4}
        />
      </mesh>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.24, 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.24, 1.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.1, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.35, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>

      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.1, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.35, 8]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>

      {/* Name label */}
      <Billboard position={[0, 1.85, 0]}>
        <Text
          fontSize={0.15}
          color="#e4e4e7"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {agent.name}
        </Text>
      </Billboard>

      {/* Activity ring on floor */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.25, 0.35, 32]} />
        <meshBasicMaterial color={ACTIVITY_COLORS[agent.activity] ?? '#71717a'} transparent opacity={0.3} side={2} />
      </mesh>

      {/* Walking trail particles */}
      {agent.walking && <WalkingTrail progress={agent.walking.progress} />}
    </group>
  )
}

function WalkingTrail({ progress }: { progress: number }) {
  const ref = useRef<THREE.Points>(null)
  const count = 8

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 0.1 + Math.random() * 0.3
      arr[i * 3] = Math.cos(angle) * r
      arr[i * 3 + 1] = Math.random() * 0.1
      arr[i * 3 + 2] = Math.sin(angle) * r
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = Math.max(0, 0.4 * (1 - progress))
  })

  return (
    <points ref={ref} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#3b82f6" size={0.04} transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function animateActivity(
  t: number,
  activity: string,
  headRef: React.RefObject<THREE.Mesh | null>,
  leftArmRef: React.RefObject<THREE.Group | null>,
  rightArmRef: React.RefObject<THREE.Group | null>,
  leftLegRef: React.RefObject<THREE.Mesh | null>,
  rightLegRef: React.RefObject<THREE.Mesh | null>
) {
  switch (activity) {
    case 'idle':
      if (headRef.current) {
        headRef.current.position.y = 1.45 + Math.sin(t * 1.2) * 0.02
      }
      resetLimbs(leftArmRef, rightArmRef, leftLegRef, rightLegRef)
      break

    case 'working':
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.7 + Math.sin(t * 4) * 0.15
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.7 + Math.sin(t * 4 + Math.PI) * 0.15
      }
      break

    case 'meeting':
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(t * 0.5) * 0.08
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = 0.3
        leftArmRef.current.rotation.x = -0.2
      }
      break

    case 'walking':
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 6) * 0.4
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t * 6 + Math.PI) * 0.4
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(t * 6 + Math.PI) * 0.35
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = Math.sin(t * 6) * 0.35
      }
      break
  }
}

function resetLimbs(
  leftArmRef: React.RefObject<THREE.Group | null>,
  rightArmRef: React.RefObject<THREE.Group | null>,
  leftLegRef: React.RefObject<THREE.Mesh | null>,
  rightLegRef: React.RefObject<THREE.Mesh | null>
) {
  if (leftArmRef.current) {
    leftArmRef.current.rotation.x = 0
    leftArmRef.current.rotation.z = 0
  }
  if (rightArmRef.current) {
    rightArmRef.current.rotation.x = 0
    rightArmRef.current.rotation.z = 0
  }
  if (leftLegRef.current) leftLegRef.current.rotation.x = 0
  if (rightLegRef.current) rightLegRef.current.rotation.x = 0
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function darken(hex: string, factor: number): string {
  const c = new THREE.Color(hex)
  c.multiplyScalar(factor)
  return '#' + c.getHexString()
}
