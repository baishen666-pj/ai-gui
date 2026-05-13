import { join } from 'path'
import { APP_HOME, readJsonFile, writeJsonFile } from './utils'
import type { ConnectionConfig, ProviderConfig } from '../shared/types'

export type { ConnectionConfig }

const CONFIG_FILE = join(APP_HOME, 'desktop.json')

const BUILTIN_PROVIDERS: ProviderConfig[] = [
  {
    id: 'zhipu',
    name: '智谱 AI',
    type: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    models: ['GLM-5V-Turbo', 'glm-4-flash', 'glm-4-air', 'glm-4-plus', 'glm-4-long', 'glm-4.7', 'glm-4'],
    defaultModel: 'GLM-5V-Turbo'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
    defaultModel: 'gpt-4o'
  },
  {
    id: 'claude',
    name: 'Claude',
    type: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250506', 'claude-opus-4-20250514'],
    defaultModel: 'claude-sonnet-4-20250514'
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    type: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    models: ['llama3', 'qwen2', 'gemma2', 'mistral', 'codellama'],
    defaultModel: 'llama3'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    models: [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o1',
      'anthropic/claude-sonnet-4-20250514',
      'anthropic/claude-haiku-4-20250506',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'meta-llama/llama-3.1-405b-instruct',
      'deepseek/deepseek-chat',
      'qwen/qwen-2.5-72b-instruct'
    ],
    defaultModel: 'openai/gpt-4o'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    discoverable: true
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (订阅)',
    type: 'chatgpt',
    authType: 'subscription',
    baseUrl: 'https://chatgpt.com/backend-api',
    apiKey: '',
    models: ['gpt-5.5', 'gpt-4o', 'o1-pro', 'o1', 'gpt-4o-mini'],
    defaultModel: 'gpt-5.5'
  }
]

const DEFAULT_CONFIG: ConnectionConfig = {
  mode: 'remote',
  langgraphUrl: 'https://open.bigmodel.cn/api/paas/v4',
  langgraphApiKey: '',
  defaultModel: 'GLM-5V-Turbo',
  providers: BUILTIN_PROVIDERS,
  activeProviderId: 'zhipu'
}

let cachedConfig: ConnectionConfig | null = null
let cacheExpiry = 0

export function getConnectionConfig(): ConnectionConfig {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiry) return cachedConfig

  const saved = readJsonFile<Partial<ConnectionConfig>>(CONFIG_FILE, {})
  cachedConfig = { ...DEFAULT_CONFIG, ...saved }
  if (!cachedConfig.providers || cachedConfig.providers.length === 0) {
    cachedConfig.providers = BUILTIN_PROVIDERS
  }
  cacheExpiry = now + 5000
  return cachedConfig
}

export function setConnectionConfig(config: Partial<ConnectionConfig>): void {
  const current = getConnectionConfig()
  const updated = { ...current, ...config }
  writeJsonFile(CONFIG_FILE, updated)
  cachedConfig = updated
  cacheExpiry = 0
}

export function getActiveProvider(): ProviderConfig {
  const config = getConnectionConfig()
  return config.providers.find((p) => p.id === config.activeProviderId) ?? config.providers[0]
}

export function setActiveProvider(providerId: string): void {
  setConnectionConfig({ activeProviderId: providerId })
}

export function updateProvider(provider: ProviderConfig): void {
  const config = getConnectionConfig()
  const providers = config.providers.map((p) => p.id === provider.id ? provider : p)
  if (!providers.find((p) => p.id === provider.id)) {
    providers.push(provider)
  }
  setConnectionConfig({ providers })
}

export function removeProvider(providerId: string): void {
  const config = getConnectionConfig()
  const providers = config.providers.filter((p) => p.id !== providerId)
  const activeProviderId = config.activeProviderId === providerId
    ? (providers[0]?.id ?? 'zhipu')
    : config.activeProviderId
  setConnectionConfig({ providers, activeProviderId })
}

export function setProviderModel(providerId: string, model: string): void {
  const config = getConnectionConfig()
  const providers = config.providers.map((p) =>
    p.id === providerId ? { ...p, defaultModel: model } : p
  )
  setConnectionConfig({ providers })
}
