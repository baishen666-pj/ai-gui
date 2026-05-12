import { useMemo, useState, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '../../stores/app'
import { OfficeLayout } from './OfficeLayout'
import { AgentCharacter } from './AgentCharacter'
import { AgentInfoPanel } from './AgentInfoPanel'
import { DEMO_AGENTS } from './constants'
import type { AgentOfficeState, StaticActivity, WalkingState, OfficePosition, LayoutItem } from './types'

const STATIC_ACTIVITIES: StaticActivity[] = ['idle', 'working', 'meeting']
const WALK_SPEED = 0.4

const DEMO_ACTIVITIES: StaticActivity[] = [
  'idle', 'working', 'working', 'meeting', 'idle', 'meeting'
]

function chairsFromLayout(items: LayoutItem[]): OfficePosition[] {
  return items
    .filter((item) => item.type === 'chair')
    .map((item) => ({
      position: [item.x, 0, item.z] as [number, number, number],
      rotation: item.rotation
    }))
}

function buildInitialAgents(
  canvasAgents: { id: string; label: string; color: string }[],
  slots: OfficePosition[]
): AgentOfficeState[] {
  if (canvasAgents.length > 0) {
    return canvasAgents.map((a, i) => ({
      id: a.id,
      name: a.label,
      color: a.color,
      activity: STATIC_ACTIVITIES[i % 3] as StaticActivity,
      slot: slots[i % slots.length] ?? slots[0],
      walking: null
    }))
  }

  return DEMO_AGENTS.map((d, i) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    activity: DEMO_ACTIVITIES[i] ?? 'idle',
    slot: slots[i % slots.length] ?? slots[0],
    walking: null
  }))
}

export function OfficeScene() {
  const canvasAgents = useAppStore((s) => s.canvasAgents)
  const officeLayout = useAppStore((s) => s.officeLayout)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const chairSlots = useMemo(() => chairsFromLayout(officeLayout), [officeLayout])

  const agentsRef = useRef<AgentOfficeState[]>([])
  const lastCycleRef = useRef(0)
  const cycleIndexRef = useRef(0)
  const prevLayoutRef = useRef(officeLayout)

  const initialAgents = useMemo(
    () => buildInitialAgents(canvasAgents, chairSlots),
    [canvasAgents, chairSlots]
  )

  // Reset agents when layout changes
  if (prevLayoutRef.current !== officeLayout) {
    prevLayoutRef.current = officeLayout
    agentsRef.current = buildInitialAgents(canvasAgents, chairsFromLayout(officeLayout))
  }

  if (agentsRef.current.length === 0) {
    agentsRef.current = initialAgents.map((a) => ({ ...a }))
  }

  const startWalk = useCallback((agentId: string, targetSlot: OfficePosition, targetActivity: StaticActivity) => {
    const agent = agentsRef.current.find((a) => a.id === agentId)
    if (!agent || agent.walking) return

    agent.walking = {
      fromPosition: [...agent.slot.position] as [number, number, number],
      toSlot: targetSlot,
      targetActivity,
      progress: 0,
      speed: WALK_SPEED + Math.random() * 0.1
    }
    agent.activity = 'walking'
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const agents = agentsRef.current
    const slots = chairSlots
    if (slots.length === 0) return

    // Cycle activities every ~8 seconds, one agent at a time
    if (t - lastCycleRef.current > 8 && agents.length > 0) {
      lastCycleRef.current = t
      const idx = cycleIndexRef.current % agents.length
      cycleIndexRef.current++
      const agent = agents[idx]

      if (!agent.walking) {
        const newActivity = STATIC_ACTIVITIES[Math.floor(Math.random() * STATIC_ACTIVITIES.length)]
        const newSlot = slots[Math.floor(Math.random() * slots.length)]
        if (newSlot.position[0] !== agent.slot.position[0] || newSlot.position[2] !== agent.slot.position[2]) {
          startWalk(agent.id, newSlot, newActivity)
        }
      }
    }

    // Advance walking agents
    for (const agent of agents) {
      if (!agent.walking) continue
      const w = agent.walking
      w.progress += state.clock.getDelta() * w.speed

      if (w.progress >= 1) {
        agent.slot = w.toSlot
        agent.activity = w.targetActivity
        agent.walking = null
      }
    }
  })

  const agents = agentsRef.current
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null

  return (
    <>
      <OfficeLayout />
      {agents.map((agent) => (
        <AgentCharacter
          key={agent.id}
          agent={agent}
          onSelect={setSelectedAgentId}
        />
      ))}
      {selectedAgent && (
        <AgentInfoPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </>
  )
}
