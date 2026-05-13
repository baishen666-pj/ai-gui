import { net } from 'electron'
import { parseSseBlock, processSseData, processCustomEvent } from './sse-parser'
import type { SseCallbacks } from './sse-parser'
import { getActiveProvider } from './config'
import { getStrategy } from './providers/registry'
import type { ProviderConfig } from '../shared/types'

export interface SendMessageOptions {
  messages: { role: string; content: string | object[] }[]
  model?: string
  profile?: string
}

const MAX_RETRIES = 2

export function sendMessage(opts: SendMessageOptions, cb: SseCallbacks): AbortController {
  const controller = new AbortController()
  const provider = getActiveProvider()
  const strategy = getStrategy(provider.type)

  if (strategy.isSubscription) {
    return sendSubscriptionMessage(opts, cb, controller, provider, strategy)
  }

  let attempt = 0

  const trySend = (): AbortController => {
    const wrappedCb: SseCallbacks = {
      onChunk: cb.onChunk,
      onDone: cb.onDone,
      onToolProgress: cb.onToolProgress,
      onReasoning: cb.onReasoning,
      onError: (msg) => {
        if (attempt < MAX_RETRIES && controller.signal.aborted === false) {
          attempt++
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
          setTimeout(trySend, delay)
        } else {
          cb.onError?.(msg)
        }
      }
    }
    return sendProviderMessage(opts, wrappedCb, controller, provider, strategy)
  }

  trySend()
  return controller
}

function sendProviderMessage(
  opts: SendMessageOptions,
  cb: SseCallbacks,
  controller: AbortController,
  provider: ProviderConfig,
  strategy: ReturnType<typeof getStrategy>
): AbortController {
  const url = strategy.buildUrl(provider.baseUrl)
  const model = opts.model || provider.defaultModel
  const body = strategy.buildBody(model, opts.messages, true)

  const request = net.request({ method: 'POST', url })
  request.setHeader('Content-Type', 'application/json')
  strategy.applyAuthHeaders(request, provider.apiKey)
  strategy.applyExtraHeaders(request, provider.baseUrl)

  let buffer = ''
  const state = { hasContent: false, lastError: '' }

  request.on('response', (response) => {
    if (response.statusCode !== 200) {
      let errorBody = ''
      response.on('data', (chunk: Buffer) => { errorBody += chunk.toString() })
      response.on('end', () => {
        let msg = `HTTP ${response.statusCode}`
        try {
          const parsed = JSON.parse(errorBody)
          msg = parsed.error?.message || parsed.message || msg
        } catch { /* noop */ }
        cb.onError?.(msg)
      })
      return
    }

    response.on('data', (chunk: Buffer) => {
      if (controller.signal.aborted) return
      buffer += chunk.toString('utf-8')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        if (!block.trim()) continue
        const parsed = parseSseBlock(block)
        if (!parsed) continue
        if (parsed.eventType) processCustomEvent(parsed.eventType, parsed.data, cb)
        const result = processSseData(parsed.data, cb, state)
        if (result.done) { request.abort(); return }
      }
    })

    response.on('end', () => {
      if (buffer.trim()) {
        const parsed = parseSseBlock(buffer)
        if (parsed) processSseData(parsed.data, cb, state)
      }
      if (state.hasContent) cb.onDone?.()
    })

    response.on('error', (err) => cb.onError?.(err.message))
  })

  request.on('error', (err) => {
    if (!controller.signal.aborted) cb.onError?.(err.message)
  })

  if (controller.signal.aborted) {
    request.abort()
  } else {
    controller.signal.addEventListener('abort', () => request.abort())
    request.write(body)
    request.end()
  }

  return controller
}

function sendSubscriptionMessage(
  opts: SendMessageOptions,
  cb: SseCallbacks,
  controller: AbortController,
  provider: ProviderConfig,
  strategy: ReturnType<typeof getStrategy>
): AbortController {
  const url = strategy.buildUrl(provider.baseUrl)
  const model = opts.model || provider.defaultModel
  const body = strategy.buildBody(model, opts.messages, true)

  const request = net.request({ method: 'POST', url })
  request.setHeader('Content-Type', 'application/json')
  strategy.applyAuthHeaders(request, provider.apiKey)
  strategy.applyExtraHeaders(request, provider.baseUrl)

  let buffer = ''
  let lastSentLength = 0

  request.on('response', (response) => {
    if (response.statusCode !== 200) {
      let errorBody = ''
      response.on('data', (chunk: Buffer) => { errorBody += chunk.toString() })
      response.on('end', () => {
        let msg = `HTTP ${response.statusCode}`
        try {
          const parsed = JSON.parse(errorBody)
          msg = parsed.detail || parsed.error?.message || parsed.message || msg
        } catch { /* noop */ }
        if (response.statusCode === 401) {
          msg = '登录已过期，请重新登录'
        }
        cb.onError?.(msg)
      })
      return
    }

    response.on('data', (chunk: Buffer) => {
      if (controller.signal.aborted) return
      buffer += chunk.toString('utf-8')
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (strategy.parseStreamDelta) {
            const result = strategy.parseStreamDelta(parsed, { lastSentLength })
            if (result) {
              if (result.text) {
                lastSentLength += result.text.length
                cb.onChunk?.(result.text)
              }
            }
          }
        } catch {
          // Skip malformed JSON
        }
      }
    })

    response.on('end', () => {
      cb.onDone?.()
    })

    response.on('error', (err) => cb.onError?.(err.message))
  })

  request.on('error', (err) => {
    if (!controller.signal.aborted) cb.onError?.(err.message)
  })

  if (controller.signal.aborted) {
    request.abort()
  } else {
    controller.signal.addEventListener('abort', () => request.abort())
    request.write(body)
    request.end()
  }

  return controller
}
