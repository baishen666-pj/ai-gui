import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '../chatStore'

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages()
  })

  describe('initial state', () => {
    it('has default values', () => {
      const s = useChatStore.getState()
      expect(s.view).toBe('chat')
      expect(s.messages).toEqual([])
      expect(s.isLoading).toBe(false)
      expect(s.toolProgress).toBeNull()
      expect(s.sessionId).toBeNull()
      expect(s.reasoningContent).toBe('')
      expect(s.isAiConfigMode).toBe(false)
      expect(s.chatApproval).toBeNull()
    })
  })

  describe('setView', () => {
    it('changes view', () => {
      useChatStore.getState().setView('canvas')
      expect(useChatStore.getState().view).toBe('canvas')
    })
  })

  describe('addMessage', () => {
    it('adds a message', () => {
      useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'hello', timestamp: 1 })
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].content).toBe('hello')
    })

    it('appends multiple messages', () => {
      useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'a', timestamp: 1 })
      useChatStore.getState().addMessage({ id: '2', role: 'agent', content: 'b', timestamp: 2 })
      expect(useChatStore.getState().messages).toHaveLength(2)
    })
  })

  describe('appendToLastAgent', () => {
    it('appends to existing agent message', () => {
      useChatStore.getState().addMessage({ id: '1', role: 'agent', content: 'hello', timestamp: 1 })
      useChatStore.getState().appendToLastAgent(' world')
      expect(useChatStore.getState().messages[0].content).toBe('hello world')
    })

    it('creates new agent message when last is user', () => {
      useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'hello', timestamp: 1 })
      useChatStore.getState().appendToLastAgent('response')
      expect(useChatStore.getState().messages).toHaveLength(2)
      expect(useChatStore.getState().messages[1].role).toBe('agent')
    })

    it('creates new agent message when empty', () => {
      useChatStore.getState().appendToLastAgent('start')
      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].content).toBe('start')
    })
  })

  describe('setLoading / setToolProgress / setSessionId', () => {
    it('sets loading state', () => {
      useChatStore.getState().setLoading(true)
      expect(useChatStore.getState().isLoading).toBe(true)
    })

    it('sets tool progress', () => {
      useChatStore.getState().setToolProgress('searching...')
      expect(useChatStore.getState().toolProgress).toBe('searching...')
    })

    it('sets session id', () => {
      useChatStore.getState().setSessionId('sess-123')
      expect(useChatStore.getState().sessionId).toBe('sess-123')
    })
  })

  describe('reasoning', () => {
    it('appends reasoning content', () => {
      useChatStore.getState().appendReasoning('step 1')
      useChatStore.getState().appendReasoning(' step 2')
      expect(useChatStore.getState().reasoningContent).toBe('step 1 step 2')
    })

    it('clears reasoning', () => {
      useChatStore.getState().appendReasoning('some text')
      useChatStore.getState().clearReasoning()
      expect(useChatStore.getState().reasoningContent).toBe('')
    })
  })

  describe('clearMessages', () => {
    it('resets all chat state', () => {
      useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'hello', timestamp: 1 })
      useChatStore.getState().setLoading(true)
      useChatStore.getState().setToolProgress('working')
      useChatStore.getState().setSessionId('sess-1')
      useChatStore.getState().appendReasoning('thinking')
      useChatStore.getState().submitChatApproval({
        messageId: '1', content: 'rm -rf', category: 'file_delete',
        summary: 'danger', confidence: 'high', matchedPattern: 'rm -rf',
      })
      useChatStore.getState().clearMessages()
      const s = useChatStore.getState()
      expect(s.messages).toEqual([])
      expect(s.isLoading).toBe(false)
      expect(s.toolProgress).toBeNull()
      expect(s.sessionId).toBeNull()
      expect(s.reasoningContent).toBe('')
      expect(s.chatApproval).toBeNull()
    })
  })

  describe('setAiConfigMode', () => {
    it('toggles AI config mode', () => {
      useChatStore.getState().setAiConfigMode(true)
      expect(useChatStore.getState().isAiConfigMode).toBe(true)
      useChatStore.getState().setAiConfigMode(false)
      expect(useChatStore.getState().isAiConfigMode).toBe(false)
    })
  })

  describe('chatApproval', () => {
    it('submits a chat approval request', () => {
      useChatStore.getState().submitChatApproval({
        messageId: '1', content: 'rm -rf /', category: 'file_delete',
        summary: 'force delete', confidence: 'high', matchedPattern: 'rm -rf',
      })
      const a = useChatStore.getState().chatApproval!
      expect(a).toBeDefined()
      expect(a.status).toBe('pending')
      expect(a.category).toBe('file_delete')
      expect(a.id).toBeTruthy()
    })

    it('responds to approval (approved)', () => {
      useChatStore.getState().submitChatApproval({
        messageId: '1', content: 'test', category: 'shell_exec',
        summary: 'test', confidence: 'medium', matchedPattern: 'test',
      })
      useChatStore.getState().respondChatApproval(true)
      expect(useChatStore.getState().chatApproval!.status).toBe('approved')
    })

    it('responds to approval (rejected)', () => {
      useChatStore.getState().submitChatApproval({
        messageId: '1', content: 'test', category: 'shell_exec',
        summary: 'test', confidence: 'medium', matchedPattern: 'test',
      })
      useChatStore.getState().respondChatApproval(false)
      expect(useChatStore.getState().chatApproval!.status).toBe('rejected')
    })

    it('no-ops respond when no approval exists', () => {
      useChatStore.getState().respondChatApproval(true)
      expect(useChatStore.getState().chatApproval).toBeNull()
    })
  })
})
