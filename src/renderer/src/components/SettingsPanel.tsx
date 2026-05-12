import { useState, useEffect, useCallback } from 'react'
import type { AppLocale } from '../../../shared/i18n/types'

interface ConnectionConfig {
  mode: 'local' | 'remote'
  langgraphUrl: string
  langgraphApiKey: string
  defaultModel: string
}

interface ModelConfig {
  provider: string
  model: string
  baseUrl: string
}

export function SettingsPanel() {
  const [locale, setLocalLocale] = useState<AppLocale>('zh-CN')
  const [connection, setConnection] = useState<ConnectionConfig>({
    mode: 'remote',
    langgraphUrl: 'https://open.bigmodel.cn/api/paas/v4',
    langgraphApiKey: '',
    defaultModel: 'GLM-5V-Turbo'
  })
  const [model, setModel] = useState<ModelConfig>({ provider: 'auto', model: '', baseUrl: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!window.aiGui) return
    window.aiGui.getLocale().then(setLocalLocale).catch(() => {})
    window.aiGui.getConnectionConfig().then(setConnection).catch(() => {})
    window.aiGui.getModelConfig().then(setModel).catch(() => {})
  }, [])

  const handleSave = useCallback(async () => {
    if (!window.aiGui) return
    try {
      await window.aiGui.setConnectionConfig(connection)
      await window.aiGui.setLocale(locale)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently fail
    }
  }, [connection, locale])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h2 className="text-sm font-medium text-zinc-300">设置</h2>
        <button
          onClick={handleSave}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {saved ? '已保存' : '保存'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-lg space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Agent 连接
            </h3>
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-500">运行模式</span>
                <div className="flex gap-1">
                  {(['local', 'remote'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setConnection((c) => ({ ...c, mode: m }))}
                      className={`rounded px-3 py-1.5 text-xs transition-colors ${
                        connection.mode === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {m === 'local' ? '本地模式' : '远程模式'}
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-500">API URL</span>
                <input
                  type="text"
                  value={connection.langgraphUrl}
                  onChange={(e) => setConnection((c) => ({ ...c, langgraphUrl: e.target.value }))}
                  className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 outline-none focus:border-indigo-500"
                />
              </label>

              {connection.mode === 'remote' && (
                <label className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-zinc-500">API Key</span>
                  <input
                    type="password"
                    value={connection.langgraphApiKey}
                    onChange={(e) => setConnection((c) => ({ ...c, langgraphApiKey: e.target.value }))}
                    placeholder="粘贴你的 API Key..."
                    className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 outline-none focus:border-indigo-500"
                  />
                </label>
              )}

              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-500">模型</span>
                <select
                  value={connection.defaultModel}
                  onChange={(e) => setConnection((c) => ({ ...c, defaultModel: e.target.value }))}
                  className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
                >
                  <option value="GLM-5V-Turbo">GLM-5V-Turbo</option>
                  <option value="glm-4-flash">GLM-4-Flash (免费)</option>
                  <option value="glm-4-flash-250414">GLM-4-Flash-250414 (免费)</option>
                  <option value="glm-4-air">GLM-4-Air</option>
                  <option value="glm-4-air-250414">GLM-4-Air-250414</option>
                  <option value="glm-4-plus">GLM-4-Plus</option>
                  <option value="glm-4-long">GLM-4-Long</option>
                  <option value="glm-4.7">GLM-4.7 (思考模式)</option>
                  <option value="glm-4.6">GLM-4.6</option>
                  <option value="glm-4">GLM-4</option>
                  <option value="glm-3-turbo">GLM-3-Turbo</option>
                </select>
              </label>

              <div className="flex items-center gap-2 rounded bg-indigo-600/10 px-3 py-2">
                <span className="text-xs text-indigo-400">智谱AI</span>
                <span className="text-[10px] text-zinc-600">
                  {connection.defaultModel.includes('flash') ? '免费模型 · 无需充值' : '按量计费'}
                  {connection.defaultModel === 'glm-4.7' ? ' · 支持思考模式' : ''}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              模型配置
            </h3>
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${model.provider !== 'auto' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span className="text-xs text-zinc-500">
                  {model.provider !== 'auto'
                    ? `${model.provider} / ${model.model || 'default'}`
                    : '未配置 — 使用默认模型'}
                </span>
              </div>
              {model.baseUrl && (
                <p className="text-xs text-zinc-600">Base URL: {model.baseUrl}</p>
              )}
              <p className="text-[10px] text-zinc-700">
                模型配置通过 .env 文件管理，路径：~/.ai-gui/.env
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              界面设置
            </h3>
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <label className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-zinc-500">语言</span>
                <div className="flex gap-1">
                  {([['zh-CN', '简体中文'], ['en', 'English']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setLocalLocale(val)}
                      className={`rounded px-3 py-1.5 text-xs transition-colors ${
                        locale === val
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              关于
            </h3>
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">版本</span>
                <span className="text-zinc-400">0.1.0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Electron</span>
                <span className="text-zinc-400">39</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">React</span>
                <span className="text-zinc-400">19</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Three.js</span>
                <span className="text-zinc-400">0.175</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
