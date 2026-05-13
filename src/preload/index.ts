import { contextBridge, ipcRenderer } from 'electron'
import type { AppLocale } from '../shared/i18n/types'
import type { ChatGPTSession, ConnectionConfig, ModelConfig, ProviderConfig, ScheduleTask, Workflow } from '../shared/types'

const api = {
  getLocale: (): Promise<AppLocale> => ipcRenderer.invoke('get-locale'),
  setLocale: (locale: AppLocale): Promise<AppLocale> =>
    ipcRenderer.invoke('set-locale', locale),

  getConnectionConfig: (): Promise<ConnectionConfig> =>
    ipcRenderer.invoke('get-connection-config'),
  setConnectionConfig: (config: Partial<ConnectionConfig>): Promise<boolean> =>
    ipcRenderer.invoke('set-connection-config', config),
  getModelConfig: (profile?: string): Promise<ModelConfig> =>
    ipcRenderer.invoke('get-model-config', profile),

  getActiveProvider: (): Promise<ProviderConfig> =>
    ipcRenderer.invoke('get-active-provider'),
  setActiveProvider: (id: string): Promise<void> =>
    ipcRenderer.invoke('set-active-provider', id),
  updateProvider: (provider: ProviderConfig): Promise<void> =>
    ipcRenderer.invoke('update-provider', provider),
  removeProvider: (id: string): Promise<void> =>
    ipcRenderer.invoke('remove-provider', id),

  chatgptLogin: (): Promise<ChatGPTSession> =>
    ipcRenderer.invoke('chatgpt-login'),
  chatgptLogout: (): Promise<void> =>
    ipcRenderer.invoke('chatgpt-logout'),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('open-external', url),

  chatSend: (opts: {
    messages: { role: string; content: string }[]
    model?: string
    profile?: string
  }): Promise<void> => ipcRenderer.invoke('chat-send', opts),

  chatAbort: (): Promise<void> => ipcRenderer.invoke('chat-abort'),

  onChatChunk: (cb: (chunk: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, chunk: string): void => cb(chunk)
    ipcRenderer.on('chat-chunk', handler)
    return () => ipcRenderer.removeListener('chat-chunk', handler)
  },
  onChatDone: (cb: () => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('chat-done', handler)
    return () => ipcRenderer.removeListener('chat-done', handler)
  },
  onChatError: (cb: (msg: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, msg: string): void => cb(msg)
    ipcRenderer.on('chat-error', handler)
    return () => ipcRenderer.removeListener('chat-error', handler)
  },
  onToolProgress: (cb: (tool: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, tool: string): void => cb(tool)
    ipcRenderer.on('chat-tool-progress', handler)
    return () => ipcRenderer.removeListener('chat-tool-progress', handler)
  },
  onChatReasoning: (cb: (text: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, text: string): void => cb(text)
    ipcRenderer.on('chat-reasoning', handler)
    return () => ipcRenderer.removeListener('chat-reasoning', handler)
  },

  // Sessions
  sessionsList: (limit?: number) => ipcRenderer.invoke('sessions-list', limit),
  sessionsGetMessages: (sessionId: string) => ipcRenderer.invoke('sessions-get-messages', sessionId),
  sessionsCreate: (id: string, model?: string) => ipcRenderer.invoke('sessions-create', id, model),
  sessionsEnd: (id: string) => ipcRenderer.invoke('sessions-end', id),
  sessionsUpdateTitle: (id: string, title: string) => ipcRenderer.invoke('sessions-update-title', id, title),
  sessionsDelete: (id: string) => ipcRenderer.invoke('sessions-delete', id),
  sessionsInsertMessage: (msg: { id: string; session_id: string; role: string; content: string; timestamp: number }) =>
    ipcRenderer.invoke('sessions-insert-message', msg),
  sessionsSearch: (query: string, limit?: number) => ipcRenderer.invoke('sessions-search', query, limit),

  // Notifications
  sendNotification: (opts: { title: string; body: string; silent?: boolean }) =>
    ipcRenderer.invoke('send-notification', opts),

  // Export
  saveExport: (opts: { content: string; fileName: string }) =>
    ipcRenderer.invoke('save-export', opts),

  // Persistence — Tasks
  persistenceGetTasks: () => ipcRenderer.invoke('persistence-get-tasks'),
  persistenceUpsertTask: (task: ScheduleTask) => ipcRenderer.invoke('persistence-upsert-task', task),
  persistenceDeleteTask: (id: string) => ipcRenderer.invoke('persistence-delete-task', id),

  // Persistence — Workflows
  persistenceGetWorkflows: () => ipcRenderer.invoke('persistence-get-workflows'),
  persistenceUpsertWorkflow: (wf: Workflow) => ipcRenderer.invoke('persistence-upsert-workflow', wf),
  persistenceDeleteWorkflow: (id: string) => ipcRenderer.invoke('persistence-delete-workflow', id),

  // Shell execution (for code block run)
  runShell: (command: string): Promise<string> => ipcRenderer.invoke('run-shell', command)
} as const

export type AiGuiAPI = typeof api

contextBridge.exposeInMainWorld('aiGui', api)
