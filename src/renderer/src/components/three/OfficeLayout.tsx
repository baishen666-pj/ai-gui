import { FLOOR_WIDTH, FLOOR_DEPTH, WALL_HEIGHT, COLORS } from './constants'
import { DynamicFurniture } from './OfficeZones'

export function OfficeLayout() {
  return (
    <group>
      <Floor />
      <Walls />
      <DynamicFurniture />
    </group>
  )
}

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[FLOOR_WIDTH, FLOOR_DEPTH]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} />
      </mesh>
      <gridHelper
        args={[Math.max(FLOOR_WIDTH, FLOOR_DEPTH), 40, COLORS.floorGrid, '#1f1f23']}
        position={[0, 0.001, 0]}
      />
    </group>
  )
}

function Walls() {
  const halfW = FLOOR_WIDTH / 2
  const halfD = FLOOR_DEPTH / 2
  const h = WALL_HEIGHT

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, h / 2, -halfD]}>
        <planeGeometry args={[FLOOR_WIDTH, h]} />
        <meshStandardMaterial color={COLORS.wall} transparent opacity={COLORS.wallOpacity} side={2} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-halfW, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[FLOOR_DEPTH, h]} />
        <meshStandardMaterial color={COLORS.wall} transparent opacity={COLORS.wallOpacity} side={2} />
      </mesh>
      {/* Right wall */}
      <mesh position={[halfW, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[FLOOR_DEPTH, h]} />
        <meshStandardMaterial color={COLORS.wall} transparent opacity={COLORS.wallOpacity} side={2} />
      </mesh>
    </group>
  )
}
