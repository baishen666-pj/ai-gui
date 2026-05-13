import { describe, it, expect } from 'vitest'
import { openAICompatibleStrategy } from '../openai-compat'

describe('OpenAICompatibleStrategy', () => {
  const strategy = openAICompatibleStrategy

  it('has correct protocolType', () => {
    expect(strategy.protocolType).toBe('openai')
  })

  it('is not subscription', () => {
    expect(strategy.isSubscription).toBe(false)
  })

  it('builds correct URL', () => {
    expect(strategy.buildUrl('https://api.openai.com/v1')).toBe('https://api.openai.com/v1/chat/completions')
    expect(strategy.buildUrl('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1/chat/completions')
  })

  it('builds correct body', () => {
    const messages = [{ role: 'user', content: 'hello' }]
    const body = JSON.parse(strategy.buildBody('gpt-4o', messages, true))
    expect(body).toEqual({ model: 'gpt-4o', messages, stream: true })
  })

  it('builds non-streaming body', () => {
    const body = JSON.parse(strategy.buildBody('gpt-4o', [], false))
    expect(body.stream).toBe(false)
  })

  it('applyAuthHeaders sets Bearer token', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyAuthHeaders(mockRequest, 'sk-test-key')
    expect(headers['Authorization']).toBe('Bearer sk-test-key')
  })

  it('applyAuthHeaders skips empty key', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyAuthHeaders(mockRequest, '')
    expect(headers['Authorization']).toBeUndefined()
  })

  it('applyExtraHeaders adds OpenRouter headers', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyExtraHeaders(mockRequest, 'https://openrouter.ai/api/v1')
    expect(headers['HTTP-Referer']).toBe('https://github.com/ai-gui')
    expect(headers['X-Title']).toBe('AI GUI')
  })

  it('applyExtraHeaders skips non-OpenRouter', () => {
    const headers: Record<string, string> = {}
    const mockRequest = {
      setHeader: (key: string, value: string) => { headers[key] = value }
    } as any
    strategy.applyExtraHeaders(mockRequest, 'https://api.openai.com/v1')
    expect(headers['HTTP-Referer']).toBeUndefined()
  })
})
