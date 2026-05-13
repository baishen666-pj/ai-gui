import { describe, it, expect, vi } from 'vitest'
import { parseSseBlock, processSseData, processCustomEvent } from '../sse-parser'
import type { SseCallbacks } from '../sse-parser'

function makeCb(overrides?: Partial<SseCallbacks>): SseCallbacks {
  return {
    onChunk: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    onToolProgress: vi.fn(),
    onUsage: vi.fn(),
    onReasoning: vi.fn(),
    ...overrides,
  }
}

function makeState() {
  return { hasContent: false, lastError: '' }
}

describe('parseSseBlock', () => {
  it('parses event + data lines', () => {
    const result = parseSseBlock('event: agent.tool.progress\ndata: {"tool":"web"}')
    expect(result).toEqual({ eventType: 'agent.tool.progress', data: '{"tool":"web"}' })
  })

  it('parses data-only block', () => {
    const result = parseSseBlock('data: {"choices":[]}')
    expect(result).toEqual({ eventType: '', data: '{"choices":[]}' })
  })

  it('returns null when no data line', () => {
    expect(parseSseBlock('event: ping')).toBeNull()
  })

  it('returns null for empty block', () => {
    expect(parseSseBlock('')).toBeNull()
  })

  it('handles multi-line data (last data wins)', () => {
    const result = parseSseBlock('data: first\ndata: second')
    expect(result).toEqual({ eventType: '', data: 'second' })
  })
})

describe('processCustomEvent', () => {
  it('handles agent.tool.progress with emoji', () => {
    const cb = makeCb()
    const handled = processCustomEvent('agent.tool.progress', '{"tool":"web","label":"搜索","emoji":"🔍"}', cb)
    expect(handled).toBe(true)
    expect(cb.onToolProgress).toHaveBeenCalledWith('🔍 搜索')
  })

  it('handles agent.tool.progress without emoji', () => {
    const cb = makeCb()
    const handled = processCustomEvent('agent.tool.progress', '{"tool":"web","label":"搜索"}', cb)
    expect(handled).toBe(true)
    expect(cb.onToolProgress).toHaveBeenCalledWith('搜索')
  })

  it('falls back to tool name when label missing', () => {
    const cb = makeCb()
    processCustomEvent('agent.tool.progress', '{"tool":"code"}', cb)
    expect(cb.onToolProgress).toHaveBeenCalledWith('code')
  })

  it('ignores invalid JSON', () => {
    const cb = makeCb()
    expect(processCustomEvent('agent.tool.progress', 'not-json', cb)).toBe(false)
  })

  it('returns false for non-tool-progress events', () => {
    const cb = makeCb()
    expect(processCustomEvent('ping', '{}', cb)).toBe(false)
  })

  it('returns false when callback missing', () => {
    const cb = makeCb({ onToolProgress: undefined })
    expect(processCustomEvent('agent.tool.progress', '{"tool":"web"}', cb)).toBe(false)
  })
})

describe('processSseData', () => {
  it('returns done=true for [DONE]', () => {
    const cb = makeCb()
    const state = makeState()
    const result = processSseData('[DONE]', cb, state)
    expect(result.done).toBe(true)
  })

  it('calls onDone when hasContent is true on [DONE]', () => {
    const cb = makeCb()
    const state = { hasContent: true, lastError: '' }
    processSseData('[DONE]', cb, state)
    expect(cb.onDone).toHaveBeenCalled()
  })

  it('does not call onDone when no content received', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('[DONE]', cb, state)
    expect(cb.onDone).not.toHaveBeenCalled()
  })

  it('extracts delta content and calls onChunk', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"choices":[{"delta":{"content":"Hello"}}]}', cb, state)
    expect(cb.onChunk).toHaveBeenCalledWith('Hello')
    expect(state.hasContent).toBe(true)
  })

  it('detects tool progress in content', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"choices":[{"delta":{"content":"`🔍 search_web `"}}]}', cb, state)
    expect(cb.onToolProgress).toHaveBeenCalledWith('🔍 search_web ')
    expect(cb.onChunk).not.toHaveBeenCalled()
  })

  it('extracts usage info', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"usage":{"prompt_tokens":10,"completion_tokens":20,"total_tokens":30,"cost":0.05}}', cb, state)
    expect(cb.onUsage).toHaveBeenCalledWith({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      cost: 0.05,
    })
  })

  it('handles error in parsed JSON', () => {
    const cb = makeCb()
    const state = makeState()
    const result = processSseData('{"error":{"message":"Rate limited"}}', cb, state)
    expect(result.done).toBe(false)
    expect(state.lastError).toBe('Rate limited')
  })

  it('handles error as string', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"error":"timeout"}', cb, state)
    expect(state.lastError).toBe('"timeout"')
  })

  it('handles reasoning content', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"choices":[{"delta":{"reasoning_content":"thinking..."}}]}', cb, state)
    expect(cb.onReasoning).toHaveBeenCalledWith('thinking...')
  })

  it('does not call onReasoning when callback missing', () => {
    const cb = makeCb({ onReasoning: undefined })
    const state = makeState()
    const result = processSseData('{"choices":[{"delta":{"reasoning_content":"hmm"}}]}', cb, state)
    expect(result.done).toBe(false)
  })

  it('ignores invalid JSON gracefully', () => {
    const cb = makeCb()
    const state = makeState()
    const result = processSseData('not-valid-json', cb, state)
    expect(result.done).toBe(false)
    expect(cb.onChunk).not.toHaveBeenCalled()
  })

  it('passes through whitespace-only delta content', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"choices":[{"delta":{"content":"   "}}]}', cb, state)
    expect(cb.onChunk).toHaveBeenCalledWith('   ')
  })

  it('defaults usage tokens to 0 when missing', () => {
    const cb = makeCb()
    const state = makeState()
    processSseData('{"usage":{}}', cb, state)
    expect(cb.onUsage).toHaveBeenCalledWith({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: undefined,
    })
  })
})
