import type { ClientRequest } from 'electron'
import type { ProviderStrategy, ChatMessageInput } from './types'

export class ClaudeStrategy implements ProviderStrategy {
  readonly protocolType = 'claude'
  readonly isSubscription = false

  buildUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/$/, '')}/messages`
  }

  buildBody(model: string, messages: ChatMessageInput[], stream: boolean): string {
    const systemMsg = messages.find((m) => m.role === 'system')
    const otherMsgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

    return JSON.stringify({
      model,
      max_tokens: 4096,
      stream,
      system: typeof systemMsg?.content === 'string' ? systemMsg.content : undefined,
      messages: otherMsgs
    })
  }

  applyAuthHeaders(request: ClientRequest, apiKey: string): void {
    if (apiKey) {
      request.setHeader('x-api-key', apiKey)
      request.setHeader('anthropic-version', '2023-06-01')
    }
  }

  applyExtraHeaders(_request: ClientRequest, _baseUrl: string): void {
    // No extra headers needed
  }
}

export const claudeStrategy = new ClaudeStrategy()
