import type { AiGuiAPI } from '../../preload/index'

declare global {
  interface Window {
    aiGui: AiGuiAPI
  }
}

export {}
