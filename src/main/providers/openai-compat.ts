import type { ClientRequest } from 'electron'
import type { ProviderStrategy, ChatMessageInput } from './types'

export class OpenAICompatibleStrategy implements ProviderStrategy {
  readonly protocolType = 'openai'
  readonly isSubscription = false

  buildUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/$/, '')}/chat/completions`
  }

  buildBody(model: string, messages: ChatMessageInput[], stream: boolean): string {
    return JSON.stringify({ model, messages, stream })
  }

  applyAuthHeaders(request: ClientRequest, apiKey: string): void {
    if (apiKey) {
      request.setHeader('Authorization', `Bearer ${apiKey}`)
    }
  }

  applyExtraHeaders(request: ClientRequest, baseUrl: string): void {
    if (baseUrl.includes('openrouter.ai')) {
      request.setHeader('HTTP-Referer', 'https://github.com/ai-gui')
      request.setHeader('X-Title', 'AI GUI')
    }
  }
}

export const openAICompatibleStrategy = new OpenAICompatibleStrategy()
