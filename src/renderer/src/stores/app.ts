import { create } from 'zustand'
import type { ChatMessage, ViewMode } from '../../../shared/types'

export interface CanvasAgent {
  id: string
  label: string
  color: string
  position: { x: number; y: number }
  connections: string[]
}

interface AppState {
  view: ViewMode
  messages: ChatMessage[]
  isLoading: boolean
  toolProgress: string | null
  sessionId: string | null
  canvasAgents: CanvasAgent[]
  reasoningContent: string

  setView: (view: ViewMode) => void
  addMessage: (msg: ChatMessage) => void
  appendToLastAgent: (chunk: string) => void
  setLoading: (loading: boolean) => void
  setToolProgress: (tool: string | null) => void
  setSessionId: (id: string | null) => void
  setCanvasAgents: (agents: CanvasAgent[]) => void
  appendReasoning: (text: string) => void
  clearReasoning: () => void
  clearMessages: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'chat',
  messages: [],
  isLoading: false,
  toolProgress: null,
  sessionId: null,
  canvasAgents: [],
  reasoningContent: '',

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
  setCanvasAgents: (canvasAgents) => set({ canvasAgents }),
  appendReasoning: (text) => set((s) => ({ reasoningContent: s.reasoningContent + text })),
  clearReasoning: () => set({ reasoningContent: '' }),
  clearMessages: () => set({ messages: [], isLoading: false, toolProgress: null, sessionId: null, reasoningContent: '' })
}))
