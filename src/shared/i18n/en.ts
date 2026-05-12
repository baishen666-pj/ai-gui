import type { LocaleMessages } from './types'

export const en: LocaleMessages = {
  app: {
    title: 'AI GUI',
    subtitle: 'Multi-Agent Desktop Workbench'
  },
  sidebar: {
    chat: 'Chat',
    canvas: 'Agent Canvas',
    memory: 'Memory',
    tools: 'Tools',
    settings: 'Settings'
  },
  chat: {
    placeholder: 'Type a message, / for commands...',
    send: 'Send',
    newChat: 'New Chat',
    thinking: 'Thinking...'
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    connection: 'Connection',
    model: 'Model Config',
    local: 'Local Mode',
    remote: 'Remote Mode',
    save: 'Save'
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel'
  }
}
