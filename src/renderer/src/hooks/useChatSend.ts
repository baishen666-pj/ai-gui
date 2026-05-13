import { useCallback } from 'react'
import { useAppStore } from '../stores/app'
import { compressChatContext } from '../lib/contextManager'
import { genId } from '../lib/genId'
import type { ChatMessage } from '../../../shared/types'

interface UseChatSendDeps {
  sessionId: string | null
  addMessage: (msg: ChatMessage) => void
  setLoading: (v: boolean) => void
  appendToLastAgent: (chunk: string) => void
  setSessionId: (id: string) => void
  agentBufferRef: React.MutableRefObject<string>
  isStreamingRef: React.MutableRefObject<boolean>
}

export function useChatSend({
  sessionId,
  addMessage,
  setLoading,
  appendToLastAgent,
  setSessionId,
  agentBufferRef,
  isStreamingRef,
}: UseChatSendDeps) {
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId
    const id = genId('session-')
    if (window.aiGui) {
      try { await window.aiGui.sessionsCreate(id); setSessionId(id) }
      catch { setSessionId(id) }
    } else { setSessionId(id) }
    return id
  }, [sessionId, setSessionId])

  const buildApiMessages = useCallback((msgs: ChatMessage[], newUserMsg: ChatMessage) => {
    const soul = useAppStore.getState().soulPrompt
    const allMsgs = [...msgs, newUserMsg]
    const compressed = compressChatContext(allMsgs)
    const apiMsgs = compressed.map((m) => {
      if (m.imageBase64) {
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content: [
            { type: 'text', text: m.content || '请描述这张图片' },
            { type: 'image_url', image_url: { url: m.imageBase64 } }
          ]
        }
      }
      return { role: m.role === 'user' ? 'user' : 'assistant', content: m.content }
    })
    return soul ? [{ role: 'system', content: soul }, ...apiMsgs] : apiMsgs
  }, [])

  const sendChat = useCallback(async (text: string, pendingImage: string | null, isLoading: boolean) => {
    if ((!text && !pendingImage) || isLoading) return

    const sid = await ensureSession()
    const userMsg: ChatMessage = {
      id: genId('user-'), role: 'user', content: text || '请描述这张图片',
      timestamp: Date.now(), imageBase64: pendingImage || undefined
    }
    addMessage(userMsg)
    setLoading(true)
    agentBufferRef.current = ''
    isStreamingRef.current = true

    if (window.aiGui) {
      try {
        await window.aiGui.sessionsInsertMessage({
          id: userMsg.id, session_id: sid, role: 'user',
          content: pendingImage ? `[图片] ${text}` : text, timestamp: userMsg.timestamp
        })
        if (useAppStore.getState().messages.length <= 1) {
          const title = text.length > 30 ? text.slice(0, 30) + '...' : text
          window.aiGui.sessionsUpdateTitle(sid, title).catch(() => {})
        }
      } catch { /* silent */ }

      const currentMsgs = useAppStore.getState().messages
      const allMsgs = buildApiMessages(currentMsgs, userMsg)
      window.aiGui.chatSend({ messages: allMsgs }).catch(() => {
        addMessage({ id: genId('error-'), role: 'error', content: '连接失败。请检查设置中的 API URL 和 Key。', timestamp: Date.now() })
        setLoading(false)
      })
    } else {
      setTimeout(() => { appendToLastAgent('Agent 后端尚未接入。'); setLoading(false) }, 600)
    }
  }, [addMessage, setLoading, appendToLastAgent, ensureSession, buildApiMessages])

  return { sendChat }
}
