import { describe, it, expect, beforeEach } from 'vitest'
import { useProfileStore } from '../profileStore'

describe('profileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({
      profiles: [{ id: 'default', name: '默认', soulPrompt: '', officeLayout: [], activeProviderId: 'zhipu', canvasAgents: [] }],
      activeProfileId: 'default',
      soulPrompt: '',
      officeLayout: [],
      canvasAgents: [],
    })
  })

  describe('initial state', () => {
    it('has a default profile', () => {
      const s = useProfileStore.getState()
      expect(s.profiles).toHaveLength(1)
      expect(s.activeProfileId).toBe('default')
    })
  })

  describe('createProfile', () => {
    it('creates a new profile and switches to it', () => {
      useProfileStore.getState().createProfile('工作')
      const s = useProfileStore.getState()
      expect(s.profiles).toHaveLength(2)
      expect(s.profiles[1].name).toBe('工作')
      expect(s.activeProfileId).not.toBe('default')
    })
  })

  describe('deleteProfile', () => {
    it('deletes a profile and switches to remaining one', () => {
      useProfileStore.getState().createProfile('工作')
      const workId = useProfileStore.getState().activeProfileId
      useProfileStore.getState().deleteProfile(workId)
      expect(useProfileStore.getState().profiles).toHaveLength(1)
      expect(useProfileStore.getState().activeProfileId).toBe('default')
    })

    it('no-ops when only one profile remains', () => {
      useProfileStore.getState().deleteProfile('default')
      expect(useProfileStore.getState().profiles).toHaveLength(1)
    })
  })

  describe('renameProfile', () => {
    it('renames a profile', () => {
      useProfileStore.getState().renameProfile('default', '个人')
      expect(useProfileStore.getState().profiles[0].name).toBe('个人')
    })
  })

  describe('setSoulPrompt', () => {
    it('updates soul prompt for active profile', () => {
      useProfileStore.getState().setSoulPrompt('You are a helpful assistant.')
      expect(useProfileStore.getState().soulPrompt).toBe('You are a helpful assistant.')
      expect(useProfileStore.getState().profiles[0].soulPrompt).toBe('You are a helpful assistant.')
    })
  })

  describe('setCanvasAgents', () => {
    it('updates canvas agents for active profile', () => {
      const agents = [{ id: 'a1', label: 'Agent 1', role: 'dev', model: 'gpt-4', color: '#fff', position: { x: 0, y: 0 }, connections: [], tools: [], status: 'idle' as const }]
      useProfileStore.getState().setCanvasAgents(agents)
      expect(useProfileStore.getState().canvasAgents).toHaveLength(1)
      expect(useProfileStore.getState().profiles[0].canvasAgents).toHaveLength(1)
    })
  })

  describe('switchProfile', () => {
    it('switches to another profile', () => {
      useProfileStore.getState().setSoulPrompt('Default prompt')
      useProfileStore.getState().createProfile('工作')
      useProfileStore.getState().setSoulPrompt('Work prompt')
      useProfileStore.getState().switchProfile('default')
      expect(useProfileStore.getState().soulPrompt).toBe('Default prompt')
      expect(useProfileStore.getState().activeProfileId).toBe('default')
    })

    it('no-ops for non-existent profile', () => {
      useProfileStore.getState().switchProfile('nonexistent')
      expect(useProfileStore.getState().activeProfileId).toBe('default')
    })
  })
})
