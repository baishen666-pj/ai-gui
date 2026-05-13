import { BrowserWindow, session } from 'electron'
import { getActiveProvider, updateProvider } from './config'
import type { ChatGPTSession } from '../shared/types'

export type { ChatGPTSession }

let loginWindow: BrowserWindow | null = null

export function openChatGPTLogin(): Promise<ChatGPTSession> {
  return new Promise((resolve, reject) => {
    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.focus()
      reject(new Error('登录窗口已打开'))
      return
    }

    loginWindow = new BrowserWindow({
      width: 800,
      height: 700,
      title: '登录 ChatGPT',
      webPreferences: {
        partition: 'chatgpt-auth',
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    loginWindow.loadURL('https://chatgpt.com/auth/login')

    const pollSession = async () => {
      if (!loginWindow || loginWindow.isDestroyed()) return

      try {
        const ses = loginWindow.webContents.session
        const cookies = await ses.cookies.get({ domain: '.chatgpt.com' })

        // Check if user is logged in by looking for session cookies
        const hasSession = cookies.some((c) => c.name === '__Secure-next-auth.session-token')
        if (!hasSession) {
          setTimeout(pollSession, 2000)
          return
        }

        // Fetch the access token
        const response = await ses.fetch('https://chatgpt.com/api/auth/session', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (!response.ok) {
          setTimeout(pollSession, 2000)
          return
        }

        const data = await response.json() as ChatGPTSession
        if (!data.accessToken) {
          setTimeout(pollSession, 2000)
          return
        }

        // Save token to active provider
        const provider = getActiveProvider()
        if (provider.type === 'chatgpt') {
          updateProvider({ ...provider, apiKey: data.accessToken })
        }

        loginWindow.close()
        loginWindow = null
        resolve(data)
      } catch {
        setTimeout(pollSession, 2000)
      }
    }

    loginWindow.on('closed', () => {
      loginWindow = null
    })

    // Start polling after initial load
    loginWindow.webContents.on('did-finish-load', () => {
      setTimeout(pollSession, 1500)
    })
  })
}

export async function getChatGPTSession(): Promise<string | null> {
  const provider = getActiveProvider()
  if (provider.type !== 'chatgpt') return null
  return provider.apiKey || null
}

export function logoutChatGPT(): Promise<void> {
  return new Promise((resolve) => {
    const partition = session.fromPartition('chatgpt-auth')
    partition.clearStorageData().then(() => resolve()).catch(() => resolve())
  })
}
