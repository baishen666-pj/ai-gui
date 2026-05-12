import { DESK, MONITOR, CHAIR, ROUND_TABLE, SOFA, PLANT, COLORS } from './constants'

function Mat(props: { color: string; roughness?: number }) {
  return <meshStandardMaterial {...props} />
}

export function Desk({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  const legPositions: [number, number, number][] = [
    [-DESK.width / 2 + 0.05, -DESK.height / 2, -DESK.depth / 2 + 0.05],
    [DESK.width / 2 - 0.05, -DESK.height / 2, -DESK.depth / 2 + 0.05],
    [-DESK.width / 2 + 0.05, -DESK.height / 2, DESK.depth / 2 - 0.05],
    [DESK.width / 2 - 0.05, -DESK.height / 2, DESK.depth / 2 - 0.05]
  ]

  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      <mesh position={[0, DESK.height / 2, 0]}>
        <boxGeometry args={[DESK.width, 0.04, DESK.depth]} />
        <Mat color={COLORS.desk} />
      </mesh>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[DESK.legRadius, DESK.legRadius, DESK.legHeight, 6]} />
          <Mat color={COLORS.deskLeg} />
        </mesh>
      ))}
    </group>
  )
}

export function Monitor({ position, rotation, glowing = false }: { position: [number, number, number]; rotation?: number; glowing?: boolean }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Screen */}
      <mesh position={[0, MONITOR.height / 2 + 0.02, 0]}>
        <boxGeometry args={[MONITOR.width, MONITOR.height, MONITOR.depth]} />
        <meshStandardMaterial color={COLORS.monitor} />
      </mesh>
      {/* Screen face (glow) */}
      <mesh position={[0, MONITOR.height / 2 + 0.02, MONITOR.depth / 2 + 0.001]}>
        <planeGeometry args={[MONITOR.width - 0.04, MONITOR.height - 0.04]} />
        <meshStandardMaterial
          color={COLORS.monitorScreen}
          emissive={COLORS.monitorScreen}
          emissiveIntensity={glowing ? 0.8 : MONITOR.screenEmissive}
          toneMapped={false}
        />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <Mat color={COLORS.deskLeg} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <Mat color={COLORS.deskLeg} />
      </mesh>
    </group>
  )
}

export function Chair({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Seat */}
      <mesh position={[0, CHAIR.seatHeight, 0]}>
        <boxGeometry args={[CHAIR.seatWidth, 0.04, CHAIR.seatDepth]} />
        <Mat color={COLORS.chairSeat} />
      </mesh>
      {/* Back */}
      <mesh position={[0, CHAIR.seatHeight + CHAIR.backHeight / 2, -CHAIR.seatDepth / 2 + 0.02]}>
        <boxGeometry args={[CHAIR.seatWidth, CHAIR.backHeight, 0.04]} />
        <Mat color={COLORS.chair} />
      </mesh>
      {/* Legs */}
      {[[-0.15, 0, -0.12], [0.15, 0, -0.12], [-0.15, 0, 0.12], [0.15, 0, 0.12]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[CHAIR.legRadius, CHAIR.legRadius, CHAIR.seatHeight, 6]} />
          <Mat color={COLORS.deskLeg} />
        </mesh>
      ))}
    </group>
  )
}

export function RoundTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, ROUND_TABLE.height, 0]}>
        <cylinderGeometry args={[ROUND_TABLE.radius, ROUND_TABLE.radius, 0.05, 32]} />
        <Mat color={COLORS.roundTable} />
      </mesh>
      <mesh position={[0, ROUND_TABLE.height / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, ROUND_TABLE.height, 8]} />
        <Mat color={COLORS.deskLeg} />
      </mesh>
    </group>
  )
}

export function Sofa({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Seat cushion */}
      <mesh position={[0, SOFA.height * 0.6, 0]}>
        <boxGeometry args={[SOFA.width, SOFA.height * 0.4, SOFA.depth]} />
        <Mat color={COLORS.sofaCushion} />
      </mesh>
      {/* Base */}
      <mesh position={[0, SOFA.height * 0.3, 0]}>
        <boxGeometry args={[SOFA.width, SOFA.height * 0.3, SOFA.depth]} />
        <Mat color={COLORS.sofa} />
      </mesh>
      {/* Back */}
      <mesh position={[0, SOFA.height * 0.6 + SOFA.backHeight / 2, -SOFA.depth / 2 + 0.05]}>
        <boxGeometry args={[SOFA.width, SOFA.backHeight, 0.1]} />
        <Mat color={COLORS.sofa} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-SOFA.width / 2 + 0.05, SOFA.height * 0.6 + 0.1, 0]}>
        <boxGeometry args={[0.1, 0.3, SOFA.depth]} />
        <Mat color={COLORS.sofa} />
      </mesh>
      {/* Right arm */}
      <mesh position={[SOFA.width / 2 - 0.05, SOFA.height * 0.6 + 0.1, 0]}>
        <boxGeometry args={[0.1, 0.3, SOFA.depth]} />
        <Mat color={COLORS.sofa} />
      </mesh>
    </group>
  )
}

export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, PLANT.potHeight / 2, 0]}>
        <cylinderGeometry args={[PLANT.potRadius, PLANT.potRadius * 0.8, PLANT.potHeight, 8]} />
        <Mat color={COLORS.plantPot} />
      </mesh>
      {/* Crown — sphere cluster */}
      <mesh position={[0, PLANT.potHeight + PLANT.crownHeight * 0.6, 0]}>
        <sphereGeometry args={[PLANT.crownRadius, 8, 8]} />
        <meshStandardMaterial color={COLORS.plant} roughness={0.8} />
      </mesh>
      <mesh position={[PLANT.crownRadius * 0.4, PLANT.potHeight + PLANT.crownHeight * 0.3, PLANT.crownRadius * 0.3]}>
        <sphereGeometry args={[PLANT.crownRadius * 0.7, 8, 8]} />
        <meshStandardMaterial color={COLORS.plant} roughness={0.8} />
      </mesh>
    </group>
  )
}

export function CoffeeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.5]} />
        <Mat color={COLORS.roundTable} />
      </mesh>
      {[[-0.4, 0, -0.18], [0.4, 0, -0.18], [-0.4, 0, 0.18], [0.4, 0, 0.18]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.02, 0.02, 0.38, 6]} />
          <Mat color={COLORS.deskLeg} />
        </mesh>
      ))}
    </group>
  )
}
