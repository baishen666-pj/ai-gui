import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../stores/app'
import type { CanvasAgent } from '../../stores/app'

interface Agent3D {
  id: string
  name: string
  color: string
  position: [number, number, number]
  connections: string[]
}

const DEMO_AGENTS: Agent3D[] = [
  { id: 'supervisor', name: 'Supervisor', color: '#f59e0b', position: [0, 1.5, 0], connections: ['researcher', 'coder', 'tester'] },
  { id: 'researcher', name: 'Researcher', color: '#6366f1', position: [-2.5, -0.5, 1], connections: ['coder'] },
  { id: 'coder', name: 'Coder', color: '#10b981', position: [0, -0.5, -1.5], connections: ['tester'] },
  { id: 'tester', name: 'Tester', color: '#ec4899', position: [2.5, -0.5, 1], connections: ['supervisor'] },
  { id: 'writer', name: 'Writer', color: '#8b5cf6', position: [-1.5, -2, -1], connections: ['researcher'] },
  { id: 'reviewer', name: 'Reviewer', color: '#3b82f6', position: [1.5, -2, -1], connections: ['writer', 'coder'] }
]

function canvasTo3D(agents: CanvasAgent[]): Agent3D[] {
  if (agents.length === 0) return DEMO_AGENTS
  const angleStep = (2 * Math.PI) / agents.length
  return agents.map((a, i) => ({
    id: a.id,
    name: a.label,
    color: a.color,
    position: [
      Math.cos(angleStep * i - Math.PI / 2) * 2.5,
      Math.sin(angleStep * i * 0.5) * 1.2,
      Math.sin(angleStep * i - Math.PI / 2) * 2.5
    ] as [number, number, number],
    connections: a.connections
  }))
}

function AgentSphere({ agent, allAgents }: { agent: Agent3D; allAgents: Agent3D[] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.position.y = agent.position[1] + Math.sin(t * 0.8 + agent.position[0]) * 0.15
    meshRef.current.rotation.y = t * 0.2

    if (glowRef.current) {
      const scale = 1.3 + Math.sin(t * 1.5) * 0.1
      glowRef.current.scale.setScalar(scale)
      glowRef.current.position.y = meshRef.current.position.y
    }
  })

  const connections = useMemo(
    () => allAgents.filter((a) => agent.connections.includes(a.id)),
    [agent, allAgents]
  )

  return (
    <group>
      <mesh
        ref={meshRef}
        position={agent.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      <mesh ref={glowRef} position={agent.position}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.08} />
      </mesh>

      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3} position={[agent.position[0], agent.position[1] + 0.7, agent.position[2]]}>
        <Text
          fontSize={0.18}
          color="#e4e4e7"
          anchorX="center"
          anchorY="middle"
        >
          {agent.name}
        </Text>
      </Float>

      {connections.map((target) => (
        <ConnectionLine
          key={`${agent.id}-${target.id}`}
          start={agent.position}
          end={target.position}
          color={agent.color}
        />
      ))}
    </group>
  )
}

function ConnectionLine({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const linePoints = useMemo(() => {
    const mid: [number, number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.3,
      (start[2] + end[2]) / 2
    ]
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...end)
    )
    return curve.getPoints(20).map((p) => p.toArray() as [number, number, number])
  }, [start, end])

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.3}
    />
  )
}

function ParticleField() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return arr
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial color="#6366f1" size={0.03} transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function GridFloor() {
  return (
    <gridHelper args={[20, 40, '#27272a', '#1c1c1e']} position={[0, -3.5, 0]} />
  )
}

export function AgentGraph3D() {
  const canvasAgents = useAppStore((s) => s.canvasAgents)
  const agents = useMemo(() => canvasTo3D(canvasAgents), [canvasAgents])

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 3, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #09090b 0%, #18181b 100%)' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#6366f1" />
        <pointLight position={[5, -2, 3]} intensity={0.3} color="#ec4899" />

        <ParticleField />
        <GridFloor />

        {agents.map((agent) => (
          <AgentSphere key={agent.id} agent={agent} allAgents={agents} />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  )
}
