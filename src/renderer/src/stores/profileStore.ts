import { create } from 'zustand'
import { genId } from '../lib/genId'
import type { LayoutItem } from '../components/three/types'
import { DEFAULT_LAYOUT } from '../components/three/constants'
let _onProfileSwitch: (() => void) | null = null
export function setProfileSwitchHandler(handler: () => void) {
  _onProfileSwitch = handler
}

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

interface ProfileState {
  profiles: Profile[]
  activeProfileId: string
  soulPrompt: string
  officeLayout: LayoutItem[]
  canvasAgents: CanvasAgent[]
  switchProfile: (id: string) => void
  createProfile: (name: string) => void
  deleteProfile: (id: string) => void
  renameProfile: (id: string, name: string) => void
  setSoulPrompt: (prompt: string) => void
  setOfficeLayout: (items: LayoutItem[]) => void
  setCanvasAgents: (agents: CanvasAgent[]) => void
}

function updateActiveProfile(profiles: Profile[], activeProfileId: string, patch: Partial<Profile>): Profile[] {
  return profiles.map((p) =>
    p.id === activeProfileId ? { ...p, ...patch } : p
  )
}

export const useProfileStore = create<ProfileState>((set, _get) => ({
  profiles: [{ ...DEFAULT_PROFILE }],
  activeProfileId: 'default',
  soulPrompt: DEFAULT_PROFILE.soulPrompt,
  officeLayout: DEFAULT_PROFILE.officeLayout,
  canvasAgents: DEFAULT_PROFILE.canvasAgents,

  switchProfile: (id) =>
    set((s) => {
      const profile = s.profiles.find((p) => p.id === id)
      if (!profile) return {}
      _onProfileSwitch?.()
      return {
        activeProfileId: id,
        soulPrompt: profile.soulPrompt,
        officeLayout: profile.officeLayout,
        canvasAgents: profile.canvasAgents
      }
    }),

  createProfile: (name) =>
    set((s) => {
      const id = genId('profile-')
      const newProfile: Profile = {
        id,
        name,
        soulPrompt: '',
        officeLayout: [...DEFAULT_LAYOUT],
        activeProviderId: s.activeProfileId,
        canvasAgents: []
      }
      _onProfileSwitch?.()
      return {
        profiles: [...s.profiles, newProfile],
        activeProfileId: id,
        soulPrompt: newProfile.soulPrompt,
        officeLayout: newProfile.officeLayout,
        canvasAgents: newProfile.canvasAgents
      }
    }),

  deleteProfile: (id) =>
    set((s) => {
      if (s.profiles.length <= 1) return {}
      const profiles = s.profiles.filter((p) => p.id !== id)
      if (s.activeProfileId !== id) return { profiles }
      const first = profiles[0]
      _onProfileSwitch?.()
      return {
        profiles,
        activeProfileId: first.id,
        soulPrompt: first.soulPrompt,
        officeLayout: first.officeLayout,
        canvasAgents: first.canvasAgents
      }
    }),

  renameProfile: (id, name) =>
    set((s) => ({
      profiles: s.profiles.map((p) => p.id === id ? { ...p, name } : p)
    })),

  setSoulPrompt: (soulPrompt) =>
    set((s) => ({ soulPrompt, profiles: updateActiveProfile(s.profiles, s.activeProfileId, { soulPrompt }) })),

  setOfficeLayout: (officeLayout) =>
    set((s) => ({ officeLayout, profiles: updateActiveProfile(s.profiles, s.activeProfileId, { officeLayout }) })),

  setCanvasAgents: (canvasAgents) =>
    set((s) => ({ canvasAgents, profiles: updateActiveProfile(s.profiles, s.activeProfileId, { canvasAgents }) }))
}))
