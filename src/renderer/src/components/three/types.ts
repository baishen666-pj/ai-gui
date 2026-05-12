import type { Vector3Tuple } from 'three'

export type AgentActivity = 'idle' | 'working' | 'meeting' | 'walking'
export type StaticActivity = 'idle' | 'working' | 'meeting'

export type FurnitureType = 'desk' | 'monitor' | 'chair' | 'roundTable' | 'sofa' | 'plant' | 'coffeeTable'

export interface LayoutItem {
  id: string
  type: FurnitureType
  x: number
  z: number
  rotation: number
}

export interface OfficePosition {
  position: Vector3Tuple
  rotation: number
}

export interface AgentOfficeState {
  id: string
  name: string
  color: string
  activity: AgentActivity
  slot: OfficePosition
  walking: WalkingState | null
}

export interface WalkingState {
  fromPosition: Vector3Tuple
  toSlot: OfficePosition
  targetActivity: StaticActivity
  progress: number
  speed: number
}

export interface DemoAgentConfig {
  id: string
  name: string
  color: string
  role: string
  activity: StaticActivity
}
