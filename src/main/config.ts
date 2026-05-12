import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { APP_HOME, profileHome, readJsonFile, writeJsonFile } from './utils'

export interface ConnectionConfig {
  mode: 'local' | 'remote'
  langgraphUrl: string
  langgraphApiKey: string
  defaultModel: string
}

const CONFIG_FILE = join(APP_HOME, 'desktop.json')

let cachedConfig: ConnectionConfig | null = null
let cacheExpiry = 0

export function getConnectionConfig(): ConnectionConfig {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiry) return cachedConfig

  cachedConfig = readJsonFile<ConnectionConfig>(CONFIG_FILE, {
    mode: 'remote',
    langgraphUrl: 'https://open.bigmodel.cn/api/paas/v4',
    langgraphApiKey: '',
    defaultModel: 'GLM-5V-Turbo'
  })
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

export function getModelConfig(profile?: string): {
  provider: string
  model: string
  baseUrl: string
} {
  const envFile = join(profileHome(profile), '.env')
  if (!existsSync(envFile)) {
    return { provider: 'auto', model: '', baseUrl: '' }
  }
  const content = readFileSync(envFile, 'utf-8')
  const provider = content.match(/^\s*DEFAULT_PROVIDER=(.+)$/m)?.[1]?.trim() || 'auto'
  const model = content.match(/^\s*DEFAULT_MODEL=(.+)$/m)?.[1]?.trim() || ''
  const baseUrl = content.match(/^\s*OPENAI_BASE_URL=(.+)$/m)?.[1]?.trim() || ''
  return { provider, model, baseUrl }
}
