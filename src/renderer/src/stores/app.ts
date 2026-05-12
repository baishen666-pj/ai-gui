import { create } from 'zustand'
import type { ChatMessage, ViewMode } from '../../../shared/types'
import type { LayoutItem } from '../components/three/types'
import { DEFAULT_LAYOUT } from '../components/three/constants'

export interface CanvasAgent {
  id: string
  label: string
  color: string
  position: { x: number; y: number }
  connections: string[]
}

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

export const useAppStore = create<AppState>((set) => ({
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
    }))
}))
