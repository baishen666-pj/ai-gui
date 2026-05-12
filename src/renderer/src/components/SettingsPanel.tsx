import { useState, useEffect, useCallback } from 'react'
import type { AppLocale } from '../../../shared/i18n/types'
import type { ProviderConfig } from '../../../shared/types'

const PROVIDER_ICONS: Record<string, string> = {
  zhipu: '🟣',
  openai: '🟢',
  claude: '🟠',
  ollama: '🦙',
  openrouter: '🌐',
  chatgpt: '💬',
  custom: '⚙️'
}

export function SettingsPanel() {
  const [locale, setLocalLocale] = useState<AppLocale>('zh-CN')
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [activeId, setActiveId] = useState('zhipu')
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!window.aiGui) return
    window.aiGui.getLocale().then(setLocalLocale).catch(() => {})
    window.aiGui.getConnectionConfig().then((config: any) => {
      setProviders(config.providers ?? [])
      setActiveId(config.activeProviderId ?? 'zhipu')
    }).catch(() => {})
  }, [])

  const handleSave = useCallback(async () => {
    if (!window.aiGui) return
    try {
      await window.aiGui.setConnectionConfig({ providers, activeProviderId: activeId })
      await window.aiGui.setLocale(locale)
      if (editingProvider) {
        await window.aiGui.updateProvider(editingProvider)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently fail
    }
  }, [providers, activeId, locale, editingProvider])

  const handleSetActive = useCallback(async (id: string) => {
    setActiveId(id)
    if (window.aiGui) {
      await window.aiGui.setActiveProvider(id)
    }
  }, [])

  const activeProvider = providers.find((p) => p.id === activeId) ?? providers[0]

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

          {/* API Provider */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              API Provider
            </h3>
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {/* Provider tabs */}
              <div className="flex flex-wrap gap-1.5">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSetActive(p.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      activeId === p.id
                        ? 'border-indigo-600/50 bg-indigo-600/15 text-indigo-300'
                        : 'border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    <span>{PROVIDER_ICONS[p.type] ?? '⚙️'}</span>
                    <span>{p.name}</span>
                    {activeId === p.id && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </button>
                ))}
                <button
                  onClick={() => setEditingProvider({
                    id: `custom-${Date.now()}`, name: '自定义', type: 'custom',
                    baseUrl: '', apiKey: '', models: [''], defaultModel: ''
                  })}
                  className="rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-500 hover:text-zinc-400"
                >
                  + 添加
                </button>
              </div>

              {/* Active provider config */}
              {activeProvider && (
                <ProviderConfigForm
                  provider={editingProvider && editingProvider.id === activeProvider.id ? editingProvider : activeProvider}
                  onChange={setEditingProvider}
                />
              )}
            </div>
          </section>

          {/* Model selection */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              当前模型
            </h3>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-zinc-300">{activeProvider?.defaultModel ?? '未选择'}</span>
                <span className="text-xs text-zinc-600">({activeProvider?.name})</span>
              </div>
            </div>
          </section>

          {/* UI settings */}
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

          {/* Notifications */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              通知
            </h3>
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <button
                onClick={() => {
                  if (window.aiGui) {
                    window.aiGui.sendNotification({ title: 'AI GUI 通知测试', body: '如果你看到这条系统通知，说明桌面通知工作正常！' })
                  }
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
              >
                发送测试通知
              </button>
              <div className="space-y-2 text-[10px] text-zinc-600">
                <p>通知触发场景：</p>
                <div className="grid grid-cols-2 gap-1">
                  <span className="rounded bg-zinc-800 px-2 py-1">⏰ 定时任务触发</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">⏰ 定时任务失败</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">🔀 工作流完成</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">🔀 工作流失败</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">💬 聊天错误</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">🔄 长时任务完成</span>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              关于
            </h3>
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {[
                ['版本', '0.1.0'],
                ['Electron', '39'],
                ['React', '19'],
                ['Three.js', '0.175']
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-400">{v}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ProviderConfigForm({ provider, onChange }: { provider: ProviderConfig; onChange: (p: ProviderConfig) => void }) {
  const [loginStatus, setLoginStatus] = useState<'idle' | 'logging' | 'done' | 'error'>('idle')
  const update = (field: keyof ProviderConfig, value: string) => {
    onChange({ ...provider, [field]: value })
  }

  const handleLogin = async () => {
    if (!window.aiGui) return
    setLoginStatus('logging')
    try {
      const session = await window.aiGui.chatgptLogin()
      if (session?.accessToken) {
        onChange({ ...provider, apiKey: session.accessToken })
        setLoginStatus('done')
      } else {
        setLoginStatus('error')
      }
    } catch {
      setLoginStatus('error')
    }
  }

  const handleLogout = async () => {
    if (!window.aiGui) return
    await window.aiGui.chatgptLogout()
    onChange({ ...provider, apiKey: '' })
    setLoginStatus('idle')
  }

  // ChatGPT subscription uses browser login, no manual URL/Key fields
  if (provider.type === 'chatgpt') {
    return (
      <div className="space-y-3 border-t border-zinc-800 pt-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-400">
            使用你的 ChatGPT Plus/Pro 订阅直接登录，无需 API Key。
          </p>
        </div>

        {provider.apiKey ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400">已登录</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-700"
            >
              退出登录
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loginStatus === 'logging'}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loginStatus === 'logging' ? '等待登录...' : '登录 ChatGPT'}
          </button>
        )}

        {loginStatus === 'error' && (
          <p className="text-xs text-red-400">登录失败，请重试</p>
        )}

        <label className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 text-zinc-500">模型</span>
          <select
            value={provider.defaultModel}
            onChange={(e) => update('defaultModel', e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
          >
            {provider.models.map((m) => (
              <option key={m} value={m}>{m}{m === 'o1-pro' ? ' (Pro)' : ''}</option>
            ))}
          </select>
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t border-zinc-800 pt-3">
      <label className="flex items-center gap-3 text-sm">
        <span className="w-20 shrink-0 text-zinc-500">API URL</span>
        <input
          type="text"
          value={provider.baseUrl}
          onChange={(e) => update('baseUrl', e.target.value)}
          className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <span className="w-20 shrink-0 text-zinc-500">API Key</span>
        <input
          type="password"
          value={provider.apiKey}
          onChange={(e) => update('apiKey', e.target.value)}
          placeholder={provider.type === 'ollama' ? '无需 Key' : '粘贴你的 API Key...'}
          className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-zinc-300 outline-none focus:border-indigo-500"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <span className="w-20 shrink-0 text-zinc-500">模型</span>
        <select
          value={provider.defaultModel}
          onChange={(e) => update('defaultModel', e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
        >
          {provider.models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2 rounded bg-indigo-600/10 px-3 py-2">
        <span className="text-xs text-indigo-400">{PROVIDER_ICONS[provider.type]} {provider.name}</span>
        <span className="text-[10px] text-zinc-600">
          {provider.type === 'ollama' ? '本地运行 · 无需 API Key' : provider.type === 'zhipu' ? '按量计费 · flash 模型免费' : '按量计费'}
        </span>
      </div>
    </div>
  )
}
