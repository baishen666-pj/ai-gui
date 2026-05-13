import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ChatApprovalRequest } from '../../stores/app'

/**
 * Note: useApprovalHandler depends on React (useRef, useEffect, useCallback),
 * window.aiGui, and useAppStore. Since @testing-library/react is not available
 * in this project, we test the hook's core logic by extracting and calling
 * the internal callbacks directly through a lightweight React mock.
 *
 * We mock React hooks to simulate the hook's behavior without a real renderer.
 */

vi.mock('../../stores/app', () => {
  const state: Record<string, unknown> = {
    sessionId: 'session-1',
    soulPrompt: '',
    messages: [],
    chatApproval: null,
  }
  return {
    useAppStore: {
      getState: () => state,
      setState: vi.fn((patch: Record<string, unknown>) => Object.assign(state, patch)),
    },
  }
})

// Mock React hooks to capture and exercise callback logic
let refStore: Record<string, { current: unknown }> = {}
let effectQueue: Array<() => void | (() => void)> = []

vi.mock('react', () => ({
  useRef: <T>(initial: T) => {
    const key = String(initial)
    if (!refStore[key]) refStore[key] = { current: initial }
    return refStore[key] as { current: T }
  },
  useEffect: (fn: () => void | (() => void)) => { effectQueue.push(fn) },
  useCallback: (fn: (...args: unknown[]) => unknown) => fn,
}))

function runEffects() {
  for (const effect of effectQueue) {
    effect()
  }
  effectQueue = []
}

function makeApproval(status: 'pending' | 'approved' | 'rejected'): ChatApprovalRequest {
  return {
    id: 'approval-1',
    messageId: 'msg-1',
    content: 'rm -rf /tmp/test',
    category: 'file_delete',
    summary: '强制删除文件',
    confidence: 'high',
    matchedPattern: 'rm -rf',
    status,
    createdAt: Date.now(),
  }
}

describe('useApprovalHandler', () => {
  const addMessage = vi.fn()
  const setLoading = vi.fn()
  const isStreamingRef = { current: false }
  const agentBufferRef = { current: '' }

  beforeEach(async () => {
    vi.clearAllMocks()
    addMessage.mockReset()
    setLoading.mockReset()
    refStore = {}
    effectQueue = []
  })

  it('runs effect without adding messages when chatApproval is null', async () => {
    const { useApprovalHandler } = await import('../useApprovalHandler')
    useApprovalHandler({
      chatApproval: null,
      addMessage,
      setLoading,
      isStreamingRef,
      agentBufferRef,
    })
    runEffects()
    expect(addMessage).not.toHaveBeenCalled()
  })

  it('runs effect without adding messages when chatApproval status is pending', async () => {
    const { useApprovalHandler } = await import('../useApprovalHandler')
    useApprovalHandler({
      chatApproval: makeApproval('pending'),
      addMessage,
      setLoading,
      isStreamingRef,
      agentBufferRef,
    })
    runEffects()
    expect(addMessage).not.toHaveBeenCalled()
  })

  it('does not fire when prev status was not pending (e.g. initial approved)', async () => {
    const { useApprovalHandler } = await import('../useApprovalHandler')

    // First call with approved — prev was 'none', not 'pending'
    useApprovalHandler({
      chatApproval: makeApproval('approved'),
      addMessage,
      setLoading,
      isStreamingRef,
      agentBufferRef,
    })
    runEffects()
    expect(addMessage).not.toHaveBeenCalled()
  })
})
