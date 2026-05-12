import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app'
import { AgentMarkdown } from './AgentMarkdown'
import { SlashCommandMenu } from './SlashCommandMenu'
import type { SlashCommand } from './SlashCommandMenu'
import type { ChatMessage } from '../../../shared/types'

export function ChatPanel() {
  const {
    messages, isLoading, toolProgress, sessionId, reasoningContent, soulPrompt,
    addMessage, appendToLastAgent, setLoading, setToolProgress,
    clearMessages, setSessionId, setView, appendReasoning, clearReasoning
  } = useAppStore()
  const [input, setInput] = useState('')
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const agentBufferRef = useRef('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!window.aiGui) return
    const unsubChunk = window.aiGui.onChatChunk((chunk: string) => {
      appendToLastAgent(chunk)
      agentBufferRef.current += chunk
    })
    const unsubDone = () => {
      setLoading(false)
      setToolProgress(null)
      persistAgentMessage(agentBufferRef.current)
      agentBufferRef.current = ''
    }
    const unsubError = (msg: string) => {
      addMessage({ id: `error-${Date.now()}`, role: 'error', content: msg, timestamp: Date.now() })
      setLoading(false)
    }
    const unsubTool = (tool: string) => setToolProgress(tool)
    const unsubReasoning = (text: string) => appendReasoning(text)
    const doneHandler = (): void => { unsubDone(); clearReasoning() }
    const unsubDoneEvt = window.aiGui.onChatDone(doneHandler)
    const unsubErrorEvt = window.aiGui.onChatError(unsubError)
    const unsubChunkEvt = window.aiGui.onChatChunk(unsubChunk)
    const unsubToolEvt = window.aiGui.onToolProgress(unsubTool)
    const unsubReasoningEvt = window.aiGui.onChatReasoning(unsubReasoning)
    return () => {
      unsubDoneEvt(); unsubErrorEvt(); unsubChunkEvt(); unsubToolEvt(); unsubReasoningEvt()
    }
  }, [appendToLastAgent, setLoading, setToolProgress, addMessage, appendReasoning, clearReasoning])

  const persistAgentMessage = useCallback(async (content: string) => {
    if (!window.aiGui || !content || !sessionId) return
    try {
      await window.aiGui.sessionsInsertMessage({
        id: `agent-${Date.now()}`, session_id: sessionId, role: 'agent', content, timestamp: Date.now()
      })
    } catch { /* silent */ }
  }, [sessionId])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId
    const id = `session-${Date.now()}`
    if (window.aiGui) {
      try { await window.aiGui.sessionsCreate(id); setSessionId(id) }
      catch { setSessionId(id) }
    } else { setSessionId(id) }
    return id
  }, [sessionId, setSessionId])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPendingImage(result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => setPendingImage(reader.result as string)
        reader.readAsDataURL(blob)
        return
      }
    }
  }, [])

  const buildApiMessages = useCallback((msgs: ChatMessage[], newUserMsg: ChatMessage) => {
    const soul = useAppStore.getState().soulPrompt
    const apiMsgs = [...msgs, newUserMsg].map((m) => {
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

    if (soul) {
      return [{ role: 'system', content: soul }, ...apiMsgs]
    }
    return apiMsgs
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if ((!text && !pendingImage) || isLoading) return

    const sid = await ensureSession()
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: text || '请描述这张图片',
      timestamp: Date.now(), imageBase64: pendingImage || undefined
    }
    addMessage(userMsg)
    setInput('')
    setPendingImage(null)
    setSlashMenuOpen(false)
    setLoading(true)
    agentBufferRef.current = ''

    if (window.aiGui) {
      try {
        await window.aiGui.sessionsInsertMessage({
          id: userMsg.id, session_id: sid, role: 'user',
          content: pendingImage ? `[图片] ${text}` : text, timestamp: userMsg.timestamp
        })
        if (messages.length === 0) {
          const title = text.length > 30 ? text.slice(0, 30) + '...' : text
          window.aiGui.sessionsUpdateTitle(sid, title).catch(() => {})
        }
      } catch { /* silent */ }

      const allMsgs = buildApiMessages(messages, userMsg)
      window.aiGui.chatSend({ messages: allMsgs }).catch(() => {
        addMessage({ id: `error-${Date.now()}`, role: 'error', content: '连接失败。请检查设置中的 API URL 和 Key。', timestamp: Date.now() })
        setLoading(false)
      })
    } else {
      setTimeout(() => { appendToLastAgent('Agent 后端尚未接入。'); setLoading(false) }, 600)
    }
  }, [input, isLoading, messages, sessionId, pendingImage, addMessage, setLoading, appendToLastAgent, ensureSession, buildApiMessages])

  const handleSlashCommand = useCallback((cmd: SlashCommand) => {
    setSlashMenuOpen(false); setInput('')
    switch (cmd.key) {
      case 'new': case 'clear': clearMessages(); break
      case 'canvas': setView('canvas'); break
      case '3d': setView('3d'); break
      case 'memory': setView('memory'); break
      case 'tools': setView('tools'); break
      case 'soul': setView('soul'); break
      case 'settings': setView('settings'); break
      default: addMessage({ id: `system-${Date.now()}`, role: 'system', content: `${cmd.label} — ${cmd.description}`, timestamp: Date.now() })
    }
    inputRef.current?.focus()
  }, [clearMessages, setView, addMessage])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setInput(val)
    if (val === '/') { setSlashMenuOpen(true); setSlashFilter(''); updateMenuPosition() }
    else if (val.startsWith('/') && slashMenuOpen) setSlashFilter(val.slice(1))
    else setSlashMenuOpen(false)
  }, [slashMenuOpen])

  const updateMenuPosition = useCallback(() => {
    if (inputRef.current) { const rect = inputRef.current.getBoundingClientRect(); setMenuPos({ top: rect.top - 260, left: rect.left }) }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (slashMenuOpen && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) return
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!input.startsWith('/')) handleSend() }
  }, [slashMenuOpen, input, handleSend])

  const handleDeleteMessage = useCallback((id: string) => {
    const store = useAppStore.getState()
    useAppStore.setState({ messages: store.messages.filter((m) => m.id !== id) })
  }, [])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h2 className="text-sm font-medium text-zinc-300">{sessionId ? '对话' : 'AI GUI'}</h2>
        <div className="flex items-center gap-3">
          {soulPrompt && (
            <button
              onClick={() => setView('soul')}
              className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              角色已启用
            </button>
          )}
          <div className="flex gap-2">
          {isLoading && (
            <button onClick={() => window.aiGui?.chatAbort()} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-zinc-800">停止</button>
          )}
          <button onClick={clearMessages} className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">新对话</button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && <EmptyState />}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onDelete={handleDeleteMessage} onCopy={(c) => navigator.clipboard.writeText(c)} />
        ))}
        {isLoading && reasoningContent && <ReasoningBlock content={reasoningContent} />}
        {isLoading && (
          <div className="mb-3">
            <div className="inline-block max-w-[75%] rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
              {toolProgress ? `${toolProgress}...` : reasoningContent ? '生成中...' : '思考中...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="relative border-t border-zinc-800 p-3">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2">
            <img src={pendingImage} alt="待发送" className="h-16 w-16 rounded-lg border border-zinc-700 object-cover" />
            <button onClick={() => setPendingImage(null)} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300">移除</button>
          </div>
        )}
        {slashMenuOpen && (
          <SlashCommandMenu filter={slashFilter} onSelect={handleSlashCommand} onClose={() => setSlashMenuOpen(false)} position={menuPos} />
        )}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            title="上传图片"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={pendingImage ? '添加图片描述...' : '输入消息，/ 查看命令...'}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !pendingImage) || input.startsWith('/')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  const suggestions = [
    { text: '帮我分析这段代码', icon: '>' },
    { text: '描述一下这张图片', icon: '~' },
    { text: '/canvas', icon: '#' },
  ]
  return (
    <div className="flex h-full items-center justify-center text-zinc-600">
      <div className="text-center">
        <div className="mb-3 text-4xl">🕸️</div>
        <p className="text-sm font-medium text-zinc-400">多Agent桌面工作台</p>
        <p className="mt-2 text-xs text-zinc-600">输入消息、粘贴/上传图片开始对话</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <span key={s.text} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-500">
              {s.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, onDelete, onCopy }: {
  msg: ChatMessage
  onDelete: (id: string) => void
  onCopy: (text: string) => void
}) {
  const [showActions, setShowActions] = useState(false)

  if (msg.role === 'user') {
    return (
      <div className="group mb-3 text-right" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
        {msg.imageBase64 && (
          <div className="mb-1 inline-block">
            <img src={msg.imageBase64} alt="" className="max-h-48 rounded-lg border border-indigo-500/30" />
          </div>
        )}
        <div className="flex items-center justify-end gap-1">
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onCopy(msg.content)} className="rounded p-1 text-[10px] text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400">复制</button>
              <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-zinc-600 hover:bg-zinc-800 hover:text-red-400">删除</button>
            </div>
          )}
          <span className="inline-block max-w-[75%] rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">{msg.content}</span>
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="group mb-3" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
        <div className="flex items-start gap-1">
          <span className="inline-block max-w-[75%] rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{msg.content}</span>
          {showActions && <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-zinc-600 hover:text-red-400">删除</button>}
        </div>
      </div>
    )
  }

  if (msg.role === 'system') {
    return <div className="mb-3 text-center"><span className="inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-500">{msg.content}</span></div>
  }

  return (
    <div className="group mb-3" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="flex items-start gap-1">
        <div className="inline-block max-w-[85%] rounded-lg bg-zinc-800/50 px-4 py-2">
          <AgentMarkdown content={msg.content} />
        </div>
        {showActions && (
          <div className="flex shrink-0 gap-1 pt-1">
            <button onClick={() => onCopy(msg.content)} className="rounded p-1 text-[10px] text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400">复制</button>
            <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-zinc-600 hover:bg-zinc-800 hover:text-red-400">删除</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReasoningBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  if (!content) return null
  return (
    <div className="mb-2 max-w-[85%]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-400"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
        <span>思考过程</span>
        <span className="text-zinc-700">({content.length}字)</span>
      </button>
      {expanded && (
        <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs leading-relaxed text-zinc-500 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )
}
