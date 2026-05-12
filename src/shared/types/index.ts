export interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'system' | 'error'
  content: string
  timestamp: number
  toolProgress?: string
  imageBase64?: string
}

export interface ProviderConfig {
  id: string
  name: string
  type: 'zhipu' | 'openai' | 'claude' | 'ollama' | 'openrouter' | 'chatgpt' | 'custom'
  baseUrl: string
  apiKey: string
  models: string[]
  defaultModel: string
}

export interface ConnectionConfig {
  mode: 'local' | 'remote'
  langgraphUrl: string
  langgraphApiKey: string
  defaultModel: string
  providers: ProviderConfig[]
  activeProviderId: string
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

export interface ScheduleTask {
  id: string
  name: string
  prompt: string
  intervalSeconds: number
  enabled: boolean
  lastRunAt: number | null
  nextRunAt: number | null
  runCount: number
  createdAt: number
}

export type WorkflowNodeType = 'start' | 'agent' | 'condition' | 'end'
export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: {
    label: string
    prompt?: string
    model?: string
    systemPrompt?: string
    condition?: string
    passOutput?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: 'yes' | 'no' | 'out'
  label?: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  startedAt: number
  completedAt: number | null
  nodeStatuses: Record<string, NodeExecutionStatus>
  nodeOutputs: Record<string, string>
  status: 'running' | 'completed' | 'failed'
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: number
  updatedAt: number
}

export type ViewMode = 'chat' | 'canvas' | '3d' | 'memory' | 'tools' | 'soul' | 'schedule' | 'workflow' | 'settings'
