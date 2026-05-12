export interface ParsedUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost?: number
}

export interface SseCallbacks {
  onChunk: (text: string) => void
  onToolProgress?: (tool: string) => void
  onUsage?: (usage: ParsedUsage) => void
  onError?: (message: string) => void
  onDone?: () => void
  onReasoning?: (text: string) => void
}

const toolProgressRe = /^`([^\s`]+)\s+([^`]+)`$/

export function processCustomEvent(
  eventType: string,
  data: string,
  cb: Pick<SseCallbacks, 'onToolProgress'>
): boolean {
  if (eventType === 'agent.tool.progress' && cb.onToolProgress) {
    try {
      const payload = JSON.parse(data)
      const label = payload.label || payload.tool || ''
      const emoji = payload.emoji || ''
      cb.onToolProgress(emoji ? `${emoji} ${label}` : label)
      return true
    } catch {}
  }
  return false
}

export interface SseDataResult {
  done: boolean
  hasContent: boolean
  error?: string
}

export function processSseData(
  data: string,
  cb: SseCallbacks,
  state: { hasContent: boolean; lastError: string }
): SseDataResult {
  if (data === '[DONE]') {
    if (state.hasContent) cb.onDone?.()
    return { done: true, hasContent: state.hasContent, error: state.lastError }
  }

  try {
    const parsed = JSON.parse(data)

    if (parsed.error) {
      state.lastError = parsed.error.message || JSON.stringify(parsed.error)
      return { done: false, hasContent: state.hasContent }
    }

    const delta = parsed.choices?.[0]?.delta

    if (parsed.usage && cb.onUsage) {
      cb.onUsage({
        promptTokens: parsed.usage.prompt_tokens || 0,
        completionTokens: parsed.usage.completion_tokens || 0,
        totalTokens: parsed.usage.total_tokens || 0,
        cost: parsed.usage.cost
      })
    }

    if (delta?.content) {
      const content = delta.content.trim()
      const match = toolProgressRe.exec(content)
      if (match && cb.onToolProgress) {
        cb.onToolProgress(`${match[1]} ${match[2]}`)
      } else {
        state.hasContent = true
        cb.onChunk(delta.content)
      }
    }

    if (delta?.reasoning_content && cb.onReasoning) {
      cb.onReasoning(delta.reasoning_content)
    }
  } catch {}

  return { done: false, hasContent: state.hasContent }
}

export function parseSseBlock(
  block: string
): { eventType: string; data: string } | null {
  let eventType = ''
  let dataLine = ''
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) {
      eventType = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      dataLine = line.slice(6)
    }
  }
  if (!dataLine) return null
  return { eventType, data: dataLine }
}
