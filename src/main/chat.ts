import { net } from 'electron'
import { parseSseBlock, processSseData, processCustomEvent } from './sse-parser'
import type { SseCallbacks } from './sse-parser'
import { getActiveProvider } from './config'

export interface SendMessageOptions {
  messages: { role: string; content: string | object[] }[]
  model?: string
  profile?: string
}

export function sendMessage(opts: SendMessageOptions, cb: SseCallbacks): AbortController {
  const controller = new AbortController()
  const provider = getActiveProvider()

  // Route to ChatGPT conversation API or standard OpenAI-compatible API
  if (provider.type === 'chatgpt') {
    return sendChatGPTMessage(opts, cb, controller, provider)
  }

  return sendOpenAICompatibleMessage(opts, cb, controller, provider)
}

function sendOpenAICompatibleMessage(
  opts: SendMessageOptions,
  cb: SseCallbacks,
  controller: AbortController,
  provider: ReturnType<typeof getActiveProvider>
): AbortController {
  const baseUrl = provider.baseUrl.replace(/\/$/, '')

  let url: string
  if (provider.type === 'claude') {
    url = `${baseUrl}/messages`
  } else {
    url = `${baseUrl}/chat/completions`
  }

  const model = opts.model || provider.defaultModel

  let body: string
  if (provider.type === 'claude') {
    const systemMsg = opts.messages.find((m) => m.role === 'system')
    const otherMsgs = opts.messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
    body = JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      system: typeof systemMsg?.content === 'string' ? systemMsg.content : undefined,
      messages: otherMsgs
    })
  } else {
    body = JSON.stringify({
      model,
      messages: opts.messages,
      stream: true
    })
  }

  const request = net.request({ method: 'POST', url })
  request.setHeader('Content-Type', 'application/json')

  if (provider.apiKey) {
    if (provider.type === 'claude') {
      request.setHeader('x-api-key', provider.apiKey)
      request.setHeader('anthropic-version', '2023-06-01')
    } else {
      request.setHeader('Authorization', `Bearer ${provider.apiKey}`)
    }
  }

  if (provider.baseUrl.includes('openrouter.ai')) {
    request.setHeader('HTTP-Referer', 'https://github.com/ai-gui')
    request.setHeader('X-Title', 'AI GUI')
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

function sendChatGPTMessage(
  opts: SendMessageOptions,
  cb: SseCallbacks,
  controller: AbortController,
  provider: ReturnType<typeof getActiveProvider>
): AbortController {
  const url = 'https://chatgpt.com/backend-api/conversation'
  const model = opts.model || provider.defaultModel

  // Convert OpenAI format messages to ChatGPT format
  const chatgptMessages = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: { role: m.role === 'assistant' ? 'assistant' : 'user' },
      content: { content_type: 'text', parts: [typeof m.content === 'string' ? m.content : ''] }
    }))

  const systemMsg = opts.messages.find((m) => m.role === 'system')
  const systemParts = systemMsg && typeof systemMsg.content === 'string' ? [systemMsg.content] : undefined

  const body = JSON.stringify({
    action: 'next',
    messages: chatgptMessages,
    model,
    parent_message_id: `parent-${Date.now()}`,
    ...(systemParts ? { system_message: { content_type: 'text', parts: systemParts } } : {}),
    stream: true
  })

  const request = net.request({ method: 'POST', url })
  request.setHeader('Content-Type', 'application/json')
  request.setHeader('Authorization', `Bearer ${provider.apiKey}`)
  request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  request.setHeader('Accept', 'text/event-stream')

  let buffer = ''

  request.on('response', (response) => {
    if (response.statusCode !== 200) {
      let errorBody = ''
      response.on('data', (chunk: Buffer) => { errorBody += chunk.toString() })
      response.on('end', () => {
        let msg = `HTTP ${response.statusCode}`
        try {
          const parsed = JSON.parse(errorBody)
          msg = parsed.detail || parsed.error?.message || parsed.message || msg
        } catch {}
        if (response.statusCode === 401) {
          msg = 'ChatGPT 登录已过期，请重新登录'
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
          const message = parsed.message
          if (!message) continue

          // Extract text content
          const parts = message.content?.parts
          if (parts && Array.isArray(parts)) {
            const text = parts.join('')
            // Only emit new content by tracking what we've sent
            if (text && parsed.message.id) {
              cb.onChunk?.(text)
            }
          }

          if (message.status === 'finished_successfully') {
            // Send the full final text
            const finalParts = message.content?.parts
            if (finalParts) {
              cb.onChunk?.(finalParts.join(''))
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
