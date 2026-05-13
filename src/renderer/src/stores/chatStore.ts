import { create } from 'zustand'
import { genId } from '../lib/genId'
import type { ChatMessage, ViewMode } from '../../../shared/types'
import type { DangerCategory } from '../lib/approvalDetection'

export interface ChatApprovalRequest {
  id: string
  messageId: string
  content: string
  category: DangerCategory
  summary: string
  confidence: 'high' | 'medium'
  matchedPattern: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
}

interface ChatState {
  view: ViewMode
  messages: ChatMessage[]
  isLoading: boolean
  toolProgress: string | null
  sessionId: string | null
  reasoningContent: string
  isAiConfigMode: boolean
  chatApproval: ChatApprovalRequest | null
  setView: (view: ViewMode) => void
  addMessage: (msg: ChatMessage) => void
  appendToLastAgent: (chunk: string) => void
  setLoading: (loading: boolean) => void
  setToolProgress: (tool: string | null) => void
  setSessionId: (id: string | null) => void
  appendReasoning: (text: string) => void
  clearReasoning: () => void
  clearMessages: () => void
  setAiConfigMode: (mode: boolean) => void
  submitChatApproval: (req: Omit<ChatApprovalRequest, 'id' | 'status' | 'createdAt'>) => void
  respondChatApproval: (approved: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  view: 'chat',
  messages: [],
  isLoading: false,
  toolProgress: null,
  sessionId: null,
  reasoningContent: '',
  isAiConfigMode: false,
  chatApproval: null,

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
          { id: genId('agent-'), role: 'agent', content: chunk, timestamp: Date.now() }
        ]
      }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setToolProgress: (toolProgress) => set({ toolProgress }),
  setSessionId: (sessionId) => set({ sessionId }),

  appendReasoning: (text) => set((s) => ({ reasoningContent: s.reasoningContent + text })),
  clearReasoning: () => set({ reasoningContent: '' }),
  clearMessages: () => set({ messages: [], isLoading: false, toolProgress: null, sessionId: null, reasoningContent: '', chatApproval: null }),

  setAiConfigMode: (mode) => set({ isAiConfigMode: mode }),

  submitChatApproval: (req) => set({
    chatApproval: {
      ...req,
      id: genId('chat-approval-'),
      status: 'pending' as const,
      createdAt: Date.now()
    }
  }),

  respondChatApproval: (approved) => set((s) => {
    if (!s.chatApproval) return {}
    return {
      chatApproval: {
        ...s.chatApproval,
        status: approved ? 'approved' as const : 'rejected' as const
      }
    }
  })
}))
