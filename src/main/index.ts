import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'

import { enableGpuFlags } from './gpu'
import { getLocale, setLocale } from './locale'
import { getConnectionConfig, setConnectionConfig, getActiveProvider, setActiveProvider, updateProvider, removeProvider } from './config'
import { sendMessage } from './chat'
import { openChatGPTLogin, logoutChatGPT } from './auth'
import * as sessions from './sessions'

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
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

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
  ipcMain.handle('set-active-provider', (_e, id: string) => setActiveProvider(id))
  ipcMain.handle('update-provider', (_e, provider) => updateProvider(provider))
  ipcMain.handle('remove-provider', (_e, id: string) => removeProvider(id))

  // Auth
  ipcMain.handle('chatgpt-login', () => openChatGPTLogin())
  ipcMain.handle('chatgpt-logout', () => logoutChatGPT())

  // Shell
  ipcMain.handle('open-external', (_e, url: string) => {
    shell.openExternal(url)
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
  ipcMain.handle('sessions-list', (_e, limit?: number) => sessions.listSessions(limit))
  ipcMain.handle('sessions-get-messages', (_e, sessionId: string) => sessions.getSessionMessages(sessionId))
  ipcMain.handle('sessions-create', (_e, id: string, model?: string) => sessions.createSession(id, model))
  ipcMain.handle('sessions-end', (_e, id: string) => sessions.endSession(id))
  ipcMain.handle('sessions-update-title', (_e, id: string, title: string) => sessions.updateSessionTitle(id, title))
  ipcMain.handle('sessions-delete', (_e, id: string) => sessions.deleteSession(id))
  ipcMain.handle('sessions-insert-message', (_e, msg) => sessions.insertMessage(msg))
  ipcMain.handle('sessions-search', (_e, query: string, limit?: number) => sessions.searchSessions(query, limit))
}
