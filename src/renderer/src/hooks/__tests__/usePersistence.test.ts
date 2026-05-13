import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Note: usePersistence depends on React (useEffect, useRef) and useAppStore.
 * Since @testing-library/react is not available and the vitest environment
 * is 'node' (no jsdom), we mock React hooks and use globalThis for window.
 *
 * useAppStore is used both as a Zustand hook (with selector) and as a store
 * object (.getState, .setState). We mock it as a callable function with
 * getState/setState properties.
 */

// Ensure window is available for source module references
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis
}

let effectQueue: Array<() => void | (() => void)> = []
let refStore: Record<string, { current: unknown }> = {}

vi.mock('react', () => ({
  useEffect: (fn: () => void | (() => void)) => { effectQueue.push(fn) },
  useRef: <T>(initial: T) => {
    const key = `ref_${JSON.stringify(initial)}_${Math.random()}`
    if (!refStore[key]) refStore[key] = { current: initial }
    return refStore[key] as { current: T }
  },
}))

const mockState: Record<string, unknown> = {
  scheduledTasks: [],
  workflows: [],
}

const setStateMock = vi.fn((patch: Record<string, unknown>) => Object.assign(mockState, patch))

// Mock useAppStore as both a callable hook and an object with static methods
const useAppStoreMock = Object.assign(
  vi.fn((selector: (s: Record<string, unknown>) => unknown) => selector(mockState)),
  {
    getState: () => mockState,
    setState: setStateMock,
    subscribe: vi.fn(() => vi.fn()),
    getInitialState: () => mockState,
  }
)

vi.mock('../../stores/app', () => ({
  useAppStore: useAppStoreMock,
}))

function runEffects() {
  for (const effect of effectQueue) {
    effect()
  }
  effectQueue = []
}

describe('usePersistence', () => {
  const getTasks = vi.fn().mockResolvedValue([])
  const getWorkflows = vi.fn().mockResolvedValue([])
  const upsertTask = vi.fn().mockResolvedValue(undefined)
  const deleteTask = vi.fn().mockResolvedValue(undefined)
  const upsertWorkflow = vi.fn().mockResolvedValue(undefined)
  const deleteWorkflow = vi.fn().mockResolvedValue(undefined)

  beforeEach(async () => {
    vi.clearAllMocks()
    mockState.scheduledTasks = []
    mockState.workflows = []
    effectQueue = []
    refStore = {}

    ;(globalThis as Record<string, unknown>).aiGui = {
      persistenceGetTasks: getTasks,
      persistenceGetWorkflows: getWorkflows,
      persistenceUpsertTask: upsertTask,
      persistenceDeleteTask: deleteTask,
      persistenceUpsertWorkflow: upsertWorkflow,
      persistenceDeleteWorkflow: deleteWorkflow,
    }
  })

  it('does nothing when aiGui is undefined', async () => {
    ;(globalThis as Record<string, unknown>).aiGui = undefined

    const { usePersistence } = await import('../usePersistence')
    usePersistence()
    runEffects()

    expect(getTasks).not.toHaveBeenCalled()
    expect(getWorkflows).not.toHaveBeenCalled()
  })

  it('loads tasks on mount via persistenceGetTasks', async () => {
    const { usePersistence } = await import('../usePersistence')
    usePersistence()
    runEffects()

    expect(getTasks).toHaveBeenCalled()
  })

  it('loads workflows on mount via persistenceGetWorkflows', async () => {
    const { usePersistence } = await import('../usePersistence')
    usePersistence()
    runEffects()

    expect(getWorkflows).toHaveBeenCalled()
  })

  it('handles load errors gracefully', async () => {
    getTasks.mockRejectedValueOnce(new Error('DB error'))
    getWorkflows.mockRejectedValueOnce(new Error('DB error'))

    const { usePersistence } = await import('../usePersistence')
    expect(() => {
      usePersistence()
      runEffects()
    }).not.toThrow()
  })

  it('handles empty task results without error', async () => {
    getTasks.mockResolvedValueOnce([])

    const { usePersistence } = await import('../usePersistence')
    usePersistence()
    runEffects()

    expect(getTasks).toHaveBeenCalled()
  })

  it('handles empty workflow results without error', async () => {
    getWorkflows.mockResolvedValueOnce([])

    const { usePersistence } = await import('../usePersistence')
    usePersistence()
    runEffects()

    expect(getWorkflows).toHaveBeenCalled()
  })
})
