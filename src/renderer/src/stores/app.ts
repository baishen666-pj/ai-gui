import { create } from 'zustand'
import type { ChatMessage, ViewMode, ScheduleTask, Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, NodeExecutionStatus } from '../../../shared/types'
import type { LayoutItem } from '../components/three/types'
import { DEFAULT_LAYOUT } from '../components/three/constants'

export interface CanvasAgent {
  id: string
  label: string
  role: string
  model: string
  color: string
  position: { x: number; y: number }
  connections: string[]
  tools: string[]
  status: 'idle' | 'running' | 'error' | 'success'
}

export type ThemeMode = 'dark' | 'light' | 'cyberpunk'

export interface Profile {
  id: string
  name: string
  soulPrompt: string
  officeLayout: LayoutItem[]
  activeProviderId: string
  canvasAgents: CanvasAgent[]
}

const DEFAULT_PROFILE: Profile = {
  id: 'default',
  name: '默认',
  soulPrompt: '',
  officeLayout: DEFAULT_LAYOUT,
  activeProviderId: 'zhipu',
  canvasAgents: []
}

interface AppState {
  theme: ThemeMode
  view: ViewMode
  messages: ChatMessage[]
  isLoading: boolean
  toolProgress: string | null
  sessionId: string | null
  canvasAgents: CanvasAgent[]
  reasoningContent: string
  officeLayout: LayoutItem[]
  soulPrompt: string
  profiles: Profile[]
  activeProfileId: string
  scheduledTasks: ScheduleTask[]
  workflows: Workflow[]
  activeWorkflowId: string | null
  workflowExecution: WorkflowExecution | null
  isAiConfigMode: boolean

  setView: (view: ViewMode) => void
  addMessage: (msg: ChatMessage) => void
  appendToLastAgent: (chunk: string) => void
  setLoading: (loading: boolean) => void
  setToolProgress: (tool: string | null) => void
  setSessionId: (id: string | null) => void
  setCanvasAgents: (agents: CanvasAgent[]) => void
  setOfficeLayout: (items: LayoutItem[]) => void
  setSoulPrompt: (prompt: string) => void
  appendReasoning: (text: string) => void
  clearReasoning: () => void
  clearMessages: () => void
  switchProfile: (id: string) => void
  createProfile: (name: string) => void
  deleteProfile: (id: string) => void
  renameProfile: (id: string, name: string) => void
  addScheduledTask: (task: ScheduleTask) => void
  updateScheduledTask: (id: string, patch: Partial<ScheduleTask>) => void
  deleteScheduledTask: (id: string) => void
  tickScheduledTask: (id: string) => void
  createWorkflow: (name: string) => string
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  setActiveWorkflow: (id: string | null) => void
  updateWorkflowNodes: (id: string, nodes: WorkflowNode[]) => void
  updateWorkflowEdges: (id: string, edges: WorkflowEdge[]) => void
  startWorkflowExecution: (workflowId: string) => void
  updateNodeExecution: (nodeId: string, status: NodeExecutionStatus, output?: string) => void
  completeWorkflowExecution: (status: 'completed' | 'failed') => void
  setTheme: (theme: ThemeMode) => void
  setAiConfigMode: (mode: boolean) => void
  notify: (title: string, body: string) => void
}

function syncProfileToStore(state: AppState): Partial<AppState> {
  const profile = state.profiles.find((p) => p.id === state.activeProfileId)
  if (!profile) return {}
  return {
    soulPrompt: profile.soulPrompt,
    officeLayout: profile.officeLayout,
    canvasAgents: profile.canvasAgents
  }
}

function updateActiveProfile(state: AppState, patch: Partial<Profile>): Profile[] {
  return state.profiles.map((p) =>
    p.id === state.activeProfileId ? { ...p, ...patch } : p
  )
}

function loadTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('ai-gui-theme') as ThemeMode) || 'dark'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('ai-gui-theme', theme)
}

export const useAppStore = create<AppState>((set) => ({
  theme: loadTheme(),
  view: 'chat',
  messages: [],
  isLoading: false,
  toolProgress: null,
  sessionId: null,
  canvasAgents: DEFAULT_PROFILE.canvasAgents,
  reasoningContent: '',
  officeLayout: DEFAULT_PROFILE.officeLayout,
  soulPrompt: DEFAULT_PROFILE.soulPrompt,
  profiles: [{ ...DEFAULT_PROFILE }],
  activeProfileId: 'default',
  scheduledTasks: [],
  workflows: [],
  activeWorkflowId: null,
  workflowExecution: null,
  isAiConfigMode: false,

  setView: (view) => set({ view }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendToLastAgent: (chunk) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'agent') {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
        return { messages: msgs }
      }
      return {
        messages: [
          ...msgs,
          { id: `agent-${Date.now()}`, role: 'agent', content: chunk, timestamp: Date.now() }
        ]
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setToolProgress: (toolProgress) => set({ toolProgress }),
  setSessionId: (sessionId) => set({ sessionId }),

  setCanvasAgents: (canvasAgents) =>
    set((s) => ({ canvasAgents, profiles: updateActiveProfile(s, { canvasAgents }) })),

  setOfficeLayout: (officeLayout) =>
    set((s) => ({ officeLayout, profiles: updateActiveProfile(s, { officeLayout }) })),

  setSoulPrompt: (soulPrompt) =>
    set((s) => ({ soulPrompt, profiles: updateActiveProfile(s, { soulPrompt }) })),

  appendReasoning: (text) => set((s) => ({ reasoningContent: s.reasoningContent + text })),
  clearReasoning: () => set({ reasoningContent: '' }),
  clearMessages: () => set({ messages: [], isLoading: false, toolProgress: null, sessionId: null, reasoningContent: '' }),

  switchProfile: (id) =>
    set((s) => {
      const profile = s.profiles.find((p) => p.id === id)
      if (!profile) return {}
      return {
        activeProfileId: id,
        soulPrompt: profile.soulPrompt,
        officeLayout: profile.officeLayout,
        canvasAgents: profile.canvasAgents,
        messages: [],
        isLoading: false,
        toolProgress: null,
        sessionId: null,
        reasoningContent: ''
      }
    }),

  createProfile: (name) =>
    set((s) => {
      const id = `profile-${Date.now()}`
      const newProfile: Profile = {
        id,
        name,
        soulPrompt: '',
        officeLayout: [...DEFAULT_LAYOUT],
        activeProviderId: s.activeProfileId,
        canvasAgents: []
      }
      return {
        profiles: [...s.profiles, newProfile],
        activeProfileId: id,
        soulPrompt: newProfile.soulPrompt,
        officeLayout: newProfile.officeLayout,
        canvasAgents: newProfile.canvasAgents,
        messages: [],
        isLoading: false,
        toolProgress: null,
        sessionId: null,
        reasoningContent: ''
      }
    }),

  deleteProfile: (id) =>
    set((s) => {
      if (s.profiles.length <= 1) return {}
      const profiles = s.profiles.filter((p) => p.id !== id)
      if (s.activeProfileId !== id) return { profiles }
      const first = profiles[0]
      return {
        profiles,
        activeProfileId: first.id,
        soulPrompt: first.soulPrompt,
        officeLayout: first.officeLayout,
        canvasAgents: first.canvasAgents,
        messages: [],
        isLoading: false,
        toolProgress: null,
        sessionId: null,
        reasoningContent: ''
      }
    }),

  renameProfile: (id, name) =>
    set((s) => ({
      profiles: s.profiles.map((p) => p.id === id ? { ...p, name } : p)
    })),

  addScheduledTask: (task) =>
    set((s) => ({ scheduledTasks: [...s.scheduledTasks, task] })),

  updateScheduledTask: (id, patch) =>
    set((s) => ({
      scheduledTasks: s.scheduledTasks.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      )
    })),

  deleteScheduledTask: (id) =>
    set((s) => ({
      scheduledTasks: s.scheduledTasks.filter((t) => t.id !== id)
    })),

  tickScheduledTask: (id) =>
    set((s) => ({
      scheduledTasks: s.scheduledTasks.map((t) =>
        t.id === id
          ? {
              ...t,
              lastRunAt: Date.now(),
              nextRunAt: Date.now() + t.intervalSeconds * 1000,
              runCount: t.runCount + 1
            }
          : t
      )
    })),

  createWorkflow: (name) => {
    const id = `wf-${Date.now()}`
    const now = Date.now()
    const startNode: WorkflowNode = {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: '开始' }
    }
    const workflow: Workflow = { id, name, description: '', nodes: [startNode], edges: [], createdAt: now, updatedAt: now }
    set((s) => ({ workflows: [...s.workflows, workflow], activeWorkflowId: id }))
    return id
  },

  updateWorkflow: (id, patch) =>
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w
      )
    })),

  deleteWorkflow: (id) =>
    set((s) => ({
      workflows: s.workflows.filter((w) => w.id !== id),
      activeWorkflowId: s.activeWorkflowId === id ? null : s.activeWorkflowId
    })),

  setActiveWorkflow: (id) => set({ activeWorkflowId: id }),

  updateWorkflowNodes: (id, nodes) =>
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, nodes, updatedAt: Date.now() } : w
      )
    })),

  updateWorkflowEdges: (id, edges) =>
    set((s) => ({
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, edges, updatedAt: Date.now() } : w
      )
    })),

  startWorkflowExecution: (workflowId) => {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      startedAt: Date.now(),
      completedAt: null,
      nodeStatuses: {},
      nodeOutputs: {},
      status: 'running'
    }
    set({ workflowExecution: execution })
  },

  updateNodeExecution: (nodeId, status, output) =>
    set((s) => {
      if (!s.workflowExecution) return {}
      return {
        workflowExecution: {
          ...s.workflowExecution,
          nodeStatuses: { ...s.workflowExecution.nodeStatuses, [nodeId]: status },
          nodeOutputs: output !== undefined
            ? { ...s.workflowExecution.nodeOutputs, [nodeId]: output }
            : s.workflowExecution.nodeOutputs
        }
      }
    }),

  completeWorkflowExecution: (status) =>
    set((s) => {
      if (!s.workflowExecution) return {}
      return {
        workflowExecution: {
          ...s.workflowExecution,
          status,
          completedAt: Date.now()
        }
      }
    }),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  setAiConfigMode: (mode) => set({ isAiConfigMode: mode }),

  notify: (title, body) => {
    if (window.aiGui?.sendNotification) {
      window.aiGui.sendNotification({ title, body }).catch(() => {})
    }
  }
}))
