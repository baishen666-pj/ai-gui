import { describe, it, expect } from 'vitest'
import { claudeStrategy } from '../claude'

describe('ClaudeStrategy', () => {
  const strategy = claudeStrategy

  it('has correct protocolType', () => {
    expect(strategy.protocolType).toBe('claude')
  })

  it('is not subscription', () => {
    expect(strategy.isSubscription).toBe(false)
  })

  it('builds correct URL', () => {
    expect(strategy.buildUrl('https://api.anthropic.com/v1')).toBe('https://api.anthropic.com/v1/messages')
    expect(strategy.buildUrl('https://api.anthropic.com/v1/')).toBe('https://api.anthropic.com/v1/messages')
  })

  it('builds body with system message separated', () => {
    const messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' }
    ]
    const body = JSON.parse(strategy.buildBody('claude-sonnet-4-20250514', messages, true))
    expect(body.system).toBe('You are helpful')
    expect(body.messages).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' }
    ])
    expect(body.max_tokens).toBe(4096)
    expect(body.stream).toBe(true)
    expect(body.model).toBe('claude-sonnet-4-20250514')
  })

  it('builds body without system message', () => {
    const messages = [{ role: 'user', content: 'hello' }]
    const body = JSON.parse(strategy.buildBody('claude-sonnet-4-20250514', messages, false))
    expect(body.system).toBeUndefined()
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }])
    expect(body.stream).toBe(false)
  })

  it('maps non-assistant roles to user', () => {
    const messages = [
      { role: 'user', content: 'hello' },
      { role: 'tool', content: 'result' },
      { role: 'assistant', content: 'hi' }
    ]
    const body = JSON.parse(strategy.buildBody('claude-sonnet-4-20250514', messages, true))
    expect(body.messages[0].role).toBe('user')
    expect(body.messages[1].role).toBe('user')
    expect(body.messages[2].role).toBe('assistant')
  })

  it('applyAuthHeaders sets claude-specific headers', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyAuthHeaders(mockRequest, 'sk-ant-key')
    expect(headers['x-api-key']).toBe('sk-ant-key')
    expect(headers['anthropic-version']).toBe('2023-06-01')
  })

  it('applyAuthHeaders skips empty key', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyAuthHeaders(mockRequest, '')
    expect(headers['x-api-key']).toBeUndefined()
  })
})
