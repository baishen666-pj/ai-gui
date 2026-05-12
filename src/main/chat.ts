import { net } from 'electron'
import { parseSseBlock, processSseData, processCustomEvent } from './sse-parser'
import type { SseCallbacks } from './sse-parser'
import { getConnectionConfig } from './config'

export interface SendMessageOptions {
  messages: { role: string; content: string }[]
  model?: string
  profile?: string
}

export function sendMessage(opts: SendMessageOptions, cb: SseCallbacks): AbortController {
  const controller = new AbortController()
  const config = getConnectionConfig()

  const baseUrl = config.langgraphUrl.replace(/\/$/, '')
  const url = `${baseUrl}/chat/completions`
  const body = JSON.stringify({
    model: opts.model || config.defaultModel || 'glm-4-flash',
    messages: opts.messages,
    stream: true
  })

  const request = net.request({
    method: 'POST',
    url
  })

  request.setHeader('Content-Type', 'application/json')
  if (config.langgraphApiKey) {
    request.setHeader('Authorization', `Bearer ${config.langgraphApiKey}`)
  }

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
        } catch {}
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

        if (parsed.eventType) {
          processCustomEvent(parsed.eventType, parsed.data, cb)
        }

        const result = processSseData(parsed.data, cb, state)
        if (result.done) {
          request.abort()
          return
        }
      }
    })

    response.on('end', () => {
      if (buffer.trim()) {
        const parsed = parseSseBlock(buffer)
        if (parsed) processSseData(parsed.data, cb, state)
      }
      if (state.hasContent) cb.onDone?.()
    })

    response.on('error', (err) => {
      cb.onError?.(err.message)
    })
  })

  request.on('error', (err) => {
    if (!controller.signal.aborted) {
      cb.onError?.(err.message)
    }
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
