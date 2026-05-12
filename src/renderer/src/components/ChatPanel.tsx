import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app'
import { AgentMarkdown } from './AgentMarkdown'
import { SlashCommandMenu } from './SlashCommandMenu'
import type { SlashCommand } from './SlashCommandMenu'
import type { ChatMessage } from '../../../shared/types'
import { getExportContent, getExportFileName, type ExportFormat } from '../lib/export'

export function ChatPanel() {
  const {
    messages, isLoading, toolProgress, sessionId, reasoningContent, soulPrompt,
    addMessage, appendToLastAgent, setLoading, setToolProgress,
    clearMessages, setSessionId, setView, appendReasoning, clearReasoning, notify
  } = useAppStore()
  const [input, setInput] = useState('')
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
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
      notify('聊天错误', msg.slice(0, 100))
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
      case 'schedule': setView('schedule'); break
      case 'workflow': setView('workflow'); break
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

  const handleExport = useCallback(async () => {
    const title = sessionId ? `对话 ${new Date().toLocaleDateString('zh-CN')}` : 'AI GUI 对话'
    const content = getExportContent(messages, title, exportFormat)
    const fileName = getExportFileName(title, exportFormat)

    if (window.aiGui?.saveExport) {
      const saved = await window.aiGui.saveExport({ content, fileName })
      if (saved) {
        notify('导出成功', `已保存为 ${fileName}`)
        setExportOpen(false)
      }
    } else {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
    }
  }, [messages, sessionId, exportFormat, notify])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <h2 className="text-sm font-medium text-content-heading">{sessionId ? '对话' : 'AI GUI'}</h2>
        <div className="flex items-center gap-3">
          {soulPrompt && (
            <button
              onClick={() => setView('soul')}
              className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-elevated px-2 py-0.5 text-[10px] text-content-subtle transition-colors hover:border-border-default hover:text-content-heading"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-text" />
              角色已启用
            </button>
          )}
          <div className="flex gap-2">
          {isLoading && (
            <button onClick={() => window.aiGui?.chatAbort()} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-surface-overlay">停止</button>
          )}
          {messages.length > 0 && (
            <button onClick={() => setExportOpen(true)} className="rounded px-2 py-1 text-xs text-content-subtle hover:bg-surface-overlay hover:text-content-heading" title="导出对话">导出</button>
          )}
          <button onClick={clearMessages} className="rounded px-2 py-1 text-xs text-content-subtle hover:bg-surface-overlay hover:text-content-heading">新对话</button>
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
            <div className="inline-block max-w-[75%] rounded-lg bg-surface-overlay px-3 py-2 text-sm text-content-muted">
              {toolProgress ? `${toolProgress}...` : reasoningContent ? '生成中...' : '思考中...'}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {exportOpen && (
        <ExportDialog
          messages={messages}
          sessionId={sessionId}
          format={exportFormat}
          onFormatChange={setExportFormat}
          onExport={handleExport}
          onClose={() => setExportOpen(false)}
        />
      )}

      <div className="relative border-t border-border-subtle p-3">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2">
            <img src={pendingImage} alt="待发送" className="h-16 w-16 rounded-lg border border-border-default object-cover" />
            <button onClick={() => setPendingImage(null)} className="rounded bg-surface-overlay px-2 py-1 text-xs text-content-subtle hover:text-content-heading">移除</button>
          </div>
        )}
        {slashMenuOpen && (
          <SlashCommandMenu filter={slashFilter} onSelect={handleSlashCommand} onClose={() => setSlashMenuOpen(false)} position={menuPos} />
        )}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-lg border border-border-default bg-surface-elevated px-2 py-2 text-sm text-content-subtle hover:bg-surface-overlay hover:text-content-heading"
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
            className="flex-1 rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-content-secondary placeholder-content-subtle outline-none focus:border-accent"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !pendingImage) || input.startsWith('/')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
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
    <div className="flex h-full items-center justify-center text-content-subtle">
      <div className="text-center">
        <div className="mb-3 text-4xl">🕸️</div>
        <p className="text-sm font-medium text-content-muted">多Agent桌面工作台</p>
        <p className="mt-2 text-xs text-content-subtle">输入消息、粘贴/上传图片开始对话</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <span key={s.text} className="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-xs text-content-subtle">
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
            <img src={msg.imageBase64} alt="" className="max-h-48 rounded-lg border border-accent/30" />
          </div>
        )}
        <div className="flex items-center justify-end gap-1">
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onCopy(msg.content)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-content-muted">复制</button>
              <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-red-400">删除</button>
            </div>
          )}
          <span className="inline-block max-w-[75%] rounded-lg bg-accent px-3 py-2 text-sm text-white">{msg.content}</span>
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="group mb-3" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
        <div className="flex items-start gap-1">
          <span className="inline-block max-w-[75%] rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{msg.content}</span>
          {showActions && <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-content-subtle hover:text-red-400">删除</button>}
        </div>
      </div>
    )
  }

  if (msg.role === 'system') {
    return <div className="mb-3 text-center"><span className="inline-block rounded-full bg-surface-overlay px-3 py-1 text-xs text-content-subtle">{msg.content}</span></div>
  }

  return (
    <div className="group mb-3" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="flex items-start gap-1">
        <div className="inline-block max-w-[85%] rounded-lg bg-surface-overlay/50 px-4 py-2">
          <AgentMarkdown content={msg.content} />
        </div>
        {showActions && (
          <div className="flex shrink-0 gap-1 pt-1">
            <button onClick={() => onCopy(msg.content)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-content-muted">复制</button>
            <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-red-400">删除</button>
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
        className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-elevated/50 px-3 py-1.5 text-xs text-content-subtle transition-colors hover:text-content-muted"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
        <span>思考过程</span>
        <span className="text-content-subtle">({content.length}字)</span>
      </button>
      {expanded && (
        <div className="mt-1 rounded-lg border border-border-subtle bg-surface-elevated/80 p-3 text-xs leading-relaxed text-content-subtle whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )
}

function ExportDialog({ messages, sessionId, format, onFormatChange, onExport, onClose }: {
  messages: ChatMessage[]
  sessionId: string | null
  format: ExportFormat
  onFormatChange: (f: ExportFormat) => void
  onExport: () => void
  onClose: () => void
}) {
  const title = sessionId ? `对话 ${new Date().toLocaleDateString('zh-CN')}` : 'AI GUI 对话'
  const preview = getExportContent(messages.slice(0, 3), title, format)

  const formats: { value: ExportFormat; label: string; desc: string }[] = [
    { value: 'markdown', label: 'Markdown', desc: '带格式的 .md 文件，适合阅读和博客' },
    { value: 'json', label: 'JSON', desc: '结构化数据，适合程序处理和备份' },
    { value: 'txt', label: '纯文本', desc: '简单文本格式，兼容性最好' }
  ]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[460px] rounded-xl border border-border-default bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-medium text-content-secondary">导出对话</h3>
          <button onClick={onClose} className="rounded p-1 text-content-subtle hover:text-content-heading">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-content-subtle">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onFormatChange(f.value)}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    format === f.value
                      ? 'border-accent bg-accent/10'
                      : 'border-border-default hover:border-border-default'
                  }`}
                >
                  <div className={`text-xs font-medium ${format === f.value ? 'text-accent-text' : 'text-content-muted'}`}>{f.label}</div>
                  <div className="mt-1 text-[10px] text-content-subtle">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-content-subtle">预览</label>
            <pre className="max-h-32 overflow-y-auto rounded-lg border border-border-subtle bg-surface-base p-3 text-[10px] leading-relaxed text-content-subtle whitespace-pre-wrap">
              {preview.slice(0, 500)}{preview.length > 500 ? '\n...' : ''}
            </pre>
          </div>

          <div className="flex items-center justify-between text-[10px] text-content-subtle">
            <span>共 {messages.length} 条消息</span>
            <span>{getExportFileName(title, format)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle px-4 py-3">
          <button onClick={onClose} className="rounded-lg px-4 py-1.5 text-xs text-content-subtle hover:bg-surface-overlay hover:text-content-heading">取消</button>
          <button onClick={onExport} className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover">
            保存文件
          </button>
        </div>
      </div>
    </div>
  )
}
