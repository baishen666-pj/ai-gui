import { app, BrowserWindow, Menu, ipcMain, shell, Notification, dialog } from 'electron'
import { execFile } from 'child_process'
import { join } from 'path'
import { writeFile } from 'fs/promises'

import { enableGpuFlags } from './gpu'
import { getLocale, setLocale } from './locale'
import { getConnectionConfig, setConnectionConfig, getActiveProvider, setActiveProvider, updateProvider, removeProvider } from './config'
import { sendMessage } from './chat'
import { openChatGPTLogin, logoutChatGPT } from './auth'
import * as sessions from './sessions'
import * as persistence from './persistence'

enableGpuFlags()

let mainWindow: BrowserWindow | null = null
let activeChatController: AbortController | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  setupMenu()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

function setupMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        { label: '新对话', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-new-chat') },
        { type: 'separator' },
        { label: '导出对话', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu-export') },
        { type: 'separator' },
        isMac ? { label: '关闭窗口', role: 'close' } : { label: '退出', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ].filter(Boolean) as Electron.MenuItemConstructorOptions[],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '聊天', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('menu-nav', 'chat') },
        { label: 'Agent 画布', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('menu-nav', 'canvas') },
        { label: '办公室', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('menu-nav', '3d') },
        { label: '工作流', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('menu-nav', 'workflow') },
        { type: 'separator' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { label: '重置缩放', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '缩放', role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { label: '前置所有窗口', role: 'front' as const },
        ] : []),
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于 AI GUI', click: () => mainWindow?.webContents.send('menu-about') },
        { label: '快捷键', accelerator: 'CmdOrCtrl+/', click: () => mainWindow?.webContents.send('menu-shortcuts') },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.on('window-all-closed', () => {
  app.quit()
})

function registerIpcHandlers(): void {
  // Locale
  ipcMain.handle('get-locale', () => getLocale())
  ipcMain.handle('set-locale', (_e, locale: string) => setLocale(locale as 'zh-CN' | 'en'))

  // Config
  ipcMain.handle('get-connection-config', () => getConnectionConfig())
  ipcMain.handle('set-connection-config', (_e, config) => {
    setConnectionConfig(config)
    return true
  })

  ipcMain.handle('get-active-provider', () => getActiveProvider())

  ipcMain.handle('get-model-config', () => {
    const config = getConnectionConfig()
    const provider = config.providers.find((p) => p.id === config.activeProviderId) ?? config.providers[0]
    return { provider: provider.id, model: provider.defaultModel, baseUrl: provider.baseUrl }
  })

  ipcMain.handle('set-active-provider', (_e, id: string) => setActiveProvider(id))
  ipcMain.handle('update-provider', (_e, provider) => updateProvider(provider))
  ipcMain.handle('remove-provider', (_e, id: string) => removeProvider(id))

  // Auth
  ipcMain.handle('chatgpt-login', () => openChatGPTLogin())
  ipcMain.handle('chatgpt-logout', () => logoutChatGPT())

  // Shell
  ipcMain.handle('open-external', (_e, url: string) => {
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) return
      shell.openExternal(url)
    } catch { /* invalid URL */ }
  })

  // Chat
  ipcMain.handle('chat-send', (_e, opts) => {
    if (activeChatController) {
      activeChatController.abort()
      activeChatController = null
    }

    const win = mainWindow
    if (!win || win.isDestroyed()) return

    activeChatController = sendMessage(opts, {
      onChunk(chunk) {
        if (!win.isDestroyed()) win.webContents.send('chat-chunk', chunk)
      },
      onToolProgress(tool) {
        if (!win.isDestroyed()) win.webContents.send('chat-tool-progress', tool)
      },
      onUsage(usage) {
        if (!win.isDestroyed()) win.webContents.send('chat-usage', usage)
      },
      onError(msg) {
        if (!win.isDestroyed()) win.webContents.send('chat-error', msg)
      },
      onDone() {
        if (!win.isDestroyed()) win.webContents.send('chat-done')
      },
      onReasoning(text) {
        if (!win.isDestroyed()) win.webContents.send('chat-reasoning', text)
      }
    })
  })

  ipcMain.handle('chat-abort', () => {
    if (activeChatController) {
      activeChatController.abort()
      activeChatController = null
    }
  })

  // Sessions
  ipcMain.handle('sessions-list', (_e, limit?: number) => sessions.listSessions(Math.min(limit ?? 50, 200)))
  ipcMain.handle('sessions-get-messages', (_e, sessionId: string) => {
    if (typeof sessionId !== 'string' || !sessionId) throw new Error('Invalid sessionId')
    return sessions.getSessionMessages(sessionId)
  })
  ipcMain.handle('sessions-create', (_e, id: string, model?: string) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid session id')
    return sessions.createSession(id, model)
  })
  ipcMain.handle('sessions-end', (_e, id: string) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid session id')
    return sessions.endSession(id)
  })
  ipcMain.handle('sessions-update-title', (_e, id: string, title: string) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid session id')
    return sessions.updateSessionTitle(id, String(title).slice(0, 200))
  })
  ipcMain.handle('sessions-delete', (_e, id: string) => {
    if (typeof id !== 'string' || !id) throw new Error('Invalid session id')
    return sessions.deleteSession(id)
  })
  ipcMain.handle('sessions-insert-message', (_e, msg) => {
    if (!msg || typeof msg.id !== 'string' || typeof msg.role !== 'string') throw new Error('Invalid message')
    return sessions.insertMessage(msg)
  })
  ipcMain.handle('sessions-search', (_e, query: string, limit?: number) => {
    if (typeof query !== 'string') throw new Error('Invalid query')
    return sessions.searchSessions(query, Math.min(limit ?? 20, 100))
  })

  // Notifications
  ipcMain.handle('send-notification', (_e, opts: { title: string; body: string; silent?: boolean }) => {
    if (!Notification.isSupported()) return false
    const notification = new Notification({
      title: opts.title,
      body: opts.body,
      silent: opts.silent ?? false,
      icon: join(__dirname, '../../resources/icon.png')
    })
    notification.show()
    return true
  })

  // Export
  ipcMain.handle('save-export', async (_e, opts: { content: string; fileName: string }) => {
    const safeName = opts.fileName.replace(/[/\\]/g, '_')
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: join(app.getPath('documents'), safeName),
      filters: [
        { name: '所有文件', extensions: ['*'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'JSON', extensions: ['json'] },
        { name: '文本', extensions: ['txt'] }
      ]
    })
    if (result.canceled || !result.filePath) return false
    await writeFile(result.filePath, opts.content, 'utf-8')
    return true
  })

  // Shell execution for code block run (restricted, no shell injection)
  const ALLOWED_SHELL_COMMANDS = ['node', 'python', 'python3', 'pip', 'npm', 'npx', 'echo', 'dir', 'ls', 'cat', 'pwd', 'whoami', 'date', 'git', 'curl']
  ipcMain.handle('run-shell', async (_e, command: string) => {
    const trimmed = command.trim()
    // Split into argv safely — no shell metacharacter interpretation
    const parts = trimmed.split(/\s+/)
    const baseCmd = parts[0].toLowerCase().replace(/\.(exe|cmd|bat|ps1)$/, '')
    if (!ALLOWED_SHELL_COMMANDS.includes(baseCmd)) {
      return `Error: command "${parts[0]}" is not allowed. Allowed: ${ALLOWED_SHELL_COMMANDS.join(', ')}`
    }
    return new Promise<string>((resolve) => {
      execFile(parts[0], parts.slice(1), { timeout: 10000, shell: false }, (error, stdout, stderr) => {
        if (error) resolve(`Error: ${error.message}\n${stderr}`)
        else resolve(stdout || stderr || '(no output)')
      })
    })
  })

  // Persistence — Scheduled Tasks
  ipcMain.handle('persistence-get-tasks', () => persistence.getAllTasks())
  ipcMain.handle('persistence-upsert-task', (_e, task) => persistence.upsertTask(task))
  ipcMain.handle('persistence-delete-task', (_e, id: string) => persistence.deleteTask(id))

  // Persistence — Workflows
  ipcMain.handle('persistence-get-workflows', () => persistence.getAllWorkflows())
  ipcMain.handle('persistence-upsert-workflow', (_e, wf) => persistence.upsertWorkflow(wf))
  ipcMain.handle('persistence-delete-workflow', (_e, id: string) => persistence.deleteWorkflow(id))
}
