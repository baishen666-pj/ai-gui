export interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system' | 'error'
  content: string
  timestamp: number
  toolProgress?: string
  imageBase64?: string
}

export interface ConnectionConfig {
  mode: 'local' | 'remote'
  langgraphUrl: string
  langgraphApiKey: string
  defaultModel: string
}

export interface ModelConfig {
  provider: string
  model: string
  baseUrl: string
}

export interface AgentNode {
  id: string
  name: string
  role: string
  status: 'idle' | 'running' | 'error'
  position: { x: number; y: number }
}

export interface AgentEdge {
  id: string
  source: string
  target: string
  label?: string
}

export type ViewMode = 'chat' | 'canvas' | '3d' | 'memory' | 'tools' | 'settings'
