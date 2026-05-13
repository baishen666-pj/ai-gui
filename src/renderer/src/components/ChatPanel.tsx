import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useAppStore } from '../stores/app'
import { AgentMarkdown } from './AgentMarkdown'
import { SlashCommandMenu } from './SlashCommandMenu'
import type { SlashCommand } from './SlashCommandMenu'
import type { ChatMessage } from '../../../shared/types'
import { getExportContent, getExportFileName, type ExportFormat } from '../lib/export'
import { detectDangerousContent, CATEGORY_LABELS } from '../lib/approvalDetection'
import { compressChatContext, getContextUsageInfo } from '../lib/contextManager'

export function ChatPanel() {
  const {
    messages, isLoading, toolProgress, sessionId, reasoningContent, soulPrompt,
    addMessage, appendToLastAgent, setLoading, setToolProgress,
    clearMessages, setSessionId, setView, appendReasoning, clearReasoning, notify,
    chatApproval, submitChatApproval, respondChatApproval
  } = useAppStore()
  const [input, setInput] = useState('')
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const agentBufferRef = useRef('')
  const streamBufferRef = useRef('')
  const rafIdRef = useRef(0)
  const isStreamingRef = useRef(false)

  const flushStreamBuffer = useCallback(() => {
    const chunk = streamBufferRef.current
    if (chunk) {
      streamBufferRef.current = ''
      appendToLastAgent(chunk)
      agentBufferRef.current += chunk
    }
  }, [appendToLastAgent])

  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current) return
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0
      flushStreamBuffer()
    })
  }, [flushStreamBuffer])

  useEffect(() => {
    if (isStreamingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const isAiConfigMode = useAppStore((s) => s.isAiConfigMode)

  // Handle chat approval response — send follow-up message
  const prevChatApprovalStatusRef = useRef<string>('none')
  useEffect(() => {
    if (!chatApproval) {
      prevChatApprovalStatusRef.current = 'none'
      return
    }
    if (chatApproval.status === 'pending') {
      prevChatApprovalStatusRef.current = 'pending'
      return
    }
    if (prevChatApprovalStatusRef.current !== 'pending') return
    prevChatApprovalStatusRef.current = chatApproval.status

    const categoryLabel = CATEGORY_LABELS[chatApproval.category]
    if (chatApproval.status === 'approved') {
      addMessage({
        id: `system-${Date.now()}`, role: 'system',
        content: `✅ 已批准${categoryLabel}操作，AI 将继续执行`,
        timestamp: Date.now()
      })
      handleApprovalFollowUp('approved')
    } else {
      addMessage({
        id: `system-${Date.now()}`, role: 'system',
        content: `❌ 已拒绝${categoryLabel}操作，AI 将取消执行`,
        timestamp: Date.now()
      })
      handleApprovalFollowUp('rejected')
    }
    // Clear after handling
    setTimeout(() => {
      useAppStore.setState({ chatApproval: null })
    }, 100)
  }, [chatApproval])

  const handleApprovalFollowUp = useCallback((result: 'approved' | 'rejected') => {
    if (!window.aiGui) return
    const prompt = result === 'approved'
      ? '用户已批准你的操作请求。请继续执行上述操作。'
      : '用户拒绝了你的操作请求。请不要执行此操作，并提供替代方案。'
    const sid = useAppStore.getState().sessionId
    if (!sid) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: prompt, timestamp: Date.now()
    }
    addMessage(userMsg)
    setLoading(true)
    isStreamingRef.current = true
    agentBufferRef.current = ''

    const apiMsgs = [
      ...messages.filter((m) => m.role !== 'system' && m.role !== 'error').map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      { role: 'user' as const, content: prompt }
    ]
    const soul = useAppStore.getState().soulPrompt
    const finalMsgs = soul ? [{ role: 'system', content: soul }, ...apiMsgs] : apiMsgs

    window.aiGui.chatSend({ messages: finalMsgs }).catch(() => {
      addMessage({ id: `error-${Date.now()}`, role: 'error', content: '发送后续消息失败', timestamp: Date.now() })
      setLoading(false)
    })
  }, [messages, addMessage, setLoading])

  useEffect(() => {
    if (!window.aiGui) return
    const unsubChunk = window.aiGui.onChatChunk((chunk: string) => {
      if (isAiConfigMode) return
      streamBufferRef.current += chunk
      scheduleFlush()
    })
    const unsubDone = () => {
      if (isAiConfigMode) return
      if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = 0 }
      flushStreamBuffer()
      isStreamingRef.current = false
      setLoading(false)
      setToolProgress(null)
      const finalContent = agentBufferRef.current
      persistAgentMessage(finalContent)
      agentBufferRef.current = ''

      // Auto-approval detection
      if (finalContent) {
        const detection = detectDangerousContent(finalContent)
        if (detection.detected) {
          const lastMsgId = useAppStore.getState().messages[useAppStore.getState().messages.length - 1]?.id || `agent-${Date.now()}`
          submitChatApproval({
            messageId: lastMsgId,
            content: finalContent,
            category: detection.category!,
            summary: detection.summary,
            confidence: detection.confidence,
            matchedPattern: detection.matchedPattern
          })
          const categoryLabel = CATEGORY_LABELS[detection.category!]
          addMessage({
            id: `system-${Date.now()}`, role: 'system',
            content: `⚠️ 检测到${categoryLabel}操作「${detection.summary}」，等待审批确认`,
            timestamp: Date.now()
          })
          notify('需要审批', `AI 尝试${categoryLabel}：${detection.summary}`)
        }
      }
    }
    const unsubError = (msg: string) => {
      if (isAiConfigMode) return
      addMessage({ id: `error-${Date.now()}`, role: 'error', content: msg, timestamp: Date.now() })
      setLoading(false)
      notify('聊天错误', msg.slice(0, 100))
    }
    const unsubTool = (tool: string) => { if (!isAiConfigMode) setToolProgress(tool) }
    const unsubReasoning = (text: string) => { if (!isAiConfigMode) appendReasoning(text) }
    const doneHandler = (): void => { unsubDone(); clearReasoning() }
    const unsubDoneEvt = window.aiGui.onChatDone(doneHandler)
    const unsubErrorEvt = window.aiGui.onChatError(unsubError)
    const unsubChunkEvt = window.aiGui.onChatChunk(unsubChunk)
    const unsubToolEvt = window.aiGui.onToolProgress(unsubTool)
    const unsubReasoningEvt = window.aiGui.onChatReasoning(unsubReasoning)
    return () => {
      unsubDoneEvt(); unsubErrorEvt(); unsubChunkEvt(); unsubToolEvt(); unsubReasoningEvt()
    }
  }, [appendToLastAgent, setLoading, setToolProgress, addMessage, appendReasoning, clearReasoning, flushStreamBuffer, scheduleFlush, isAiConfigMode])

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
    const allMsgs = [...msgs, newUserMsg]

    // Compress long conversation context
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
    isStreamingRef.current = true

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
      case 'approve': {
        const rooms = useAppStore.getState().projectRooms
        if (rooms.length === 0) {
          addMessage({ id: `system-${Date.now()}`, role: 'system', content: '请先在 3D 视图添加项目组', timestamp: Date.now() })
        } else {
          const room = rooms[0]
          const member = room.members[0]
          useAppStore.getState().submitApproval({
            fromMemberId: member.id,
            fromMemberName: member.name,
            fromProjectId: room.id,
            fromProjectName: room.name,
            title: '测试审批请求',
            description: '这是一条测试审批，用于验证员工→老板的审批流程。批准后员工将返回岗位。'
          })
          addMessage({ id: `system-${Date.now()}`, role: 'system', content: `📋 ${member.name} 正在前往老板办公室提交审批...`, timestamp: Date.now() })
        }
        break
      }
      default: addMessage({ id: `system-${Date.now()}`, role: 'system', content: `${cmd.label} — ${cmd.description}`, timestamp: Date.now() })
    }
    inputRef.current?.focus()
  }, [clearMessages, setView, addMessage])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    if (e.key === 'Enter' && e.shiftKey) { return }
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
          <ContextIndicator messages={messages} />
          <div className="flex gap-2">
          {isLoading && (
            <button onClick={() => window.aiGui?.chatAbort()} className="rounded px-2 py-1 text-xs text-danger hover:bg-surface-overlay">停止</button>
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
          <div className="mb-3 animate-msg-in">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-accent-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/><line x1="9" y1="19" x2="15" y2="19"/></svg>
              </div>
              <div className="rounded-lg bg-surface-overlay px-3 py-2 text-sm text-content-muted">
                {toolProgress ? (
                  <span>{toolProgress}...</span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {reasoningContent ? '生成中' : '思考中'}
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </span>
                )}
              </div>
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

      {chatApproval?.status === 'pending' && (
        <ChatApprovalBar
          summary={chatApproval.summary}
          confidence={chatApproval.confidence}
          category={chatApproval.category}
          onApprove={() => respondChatApproval(true)}
          onReject={() => respondChatApproval(false)}
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
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={pendingImage ? '添加图片描述...' : '输入消息，/ 查看命令...'}
            rows={1}
            className="auto-resize flex-1 rounded-lg border border-border-default bg-surface-elevated px-3 py-2 text-sm text-content-secondary placeholder-content-subtle outline-none focus:border-accent"
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

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/><line x1="9" y1="19" x2="15" y2="19"/></svg>
)

const MessageBubble = memo(function MessageBubble({ msg, onDelete, onCopy, onEdit }: {
  msg: ChatMessage
  onDelete: (id: string) => void
  onCopy: (text: string) => void
  onEdit?: (id: string, newContent: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  const startEdit = () => { setEditing(true); setEditText(msg.content) }
  const saveEdit = () => { if (editText.trim() && editText !== msg.content) onEdit?.(msg.id, editText.trim()); setEditing(false) }

  if (msg.role === 'user') {
    return (
      <div className="group mb-3 animate-msg-in" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
        <div className="flex items-start justify-end gap-2">
          <div className="flex flex-col items-end">
            {msg.imageBase64 && (
              <div className="mb-1">
                <img src={msg.imageBase64} alt="" className="max-h-48 rounded-lg border border-accent/30" />
              </div>
            )}
            {editing ? (
              <div className="flex max-w-[75%] items-center gap-1">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
                  className="flex-1 rounded-lg border border-accent bg-surface-elevated px-2 py-1 text-sm text-content-heading outline-none"
                  autoFocus
                />
                <button onClick={saveEdit} className="rounded bg-accent px-2 py-1 text-[10px] text-white">发送</button>
                <button onClick={() => setEditing(false)} className="rounded px-2 py-1 text-[10px] text-content-subtle hover:bg-surface-overlay">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {showActions && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onCopy(msg.content)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-content-muted">复制</button>
                    <button onClick={startEdit} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-accent-text">编辑</button>
                    <button onClick={() => onDelete(msg.id)} className="rounded p-1 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-danger">删除</button>
                  </div>
                )}
                <span className="inline-block max-w-[75%] rounded-2xl rounded-tr-sm bg-accent px-3 py-2 text-sm text-white shadow-sm">{msg.content}</span>
              </div>
            )}
            <span className="mt-0.5 text-[10px] text-content-subtle opacity-0 group-hover:opacity-100 transition-opacity">{time}</span>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-text"><UserIcon /></div>
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="group mb-3 animate-msg-in" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div>
            <span className="inline-block max-w-[75%] rounded-2xl rounded-tl-sm bg-danger-bg px-3 py-2 text-sm text-danger">{msg.content}</span>
            <div className="mt-0.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-content-subtle">{time}</span>
              {showActions && <button onClick={() => onDelete(msg.id)} className="rounded p-0.5 text-[10px] text-content-subtle hover:text-danger">删除</button>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (msg.role === 'system') {
    return <div className="mb-3 animate-msg-in text-center"><span className="inline-block rounded-full bg-surface-overlay px-3 py-1 text-xs text-content-subtle">{msg.content}</span></div>
  }

  return (
    <div className="group mb-3 animate-msg-in" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-accent-text"><BotIcon /></div>
        <div>
          <div className="inline-block max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-overlay/50 px-4 py-2 shadow-sm">
            <AgentMarkdown content={msg.content} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-content-subtle">{time}</span>
            <div className="flex gap-1">
              <button onClick={() => onCopy(msg.content)} className="rounded p-0.5 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-content-muted">复制</button>
              <button onClick={() => onDelete(msg.id)} className="rounded p-0.5 text-[10px] text-content-subtle hover:bg-surface-overlay hover:text-danger">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

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

function ChatApprovalBar({ summary, confidence, category, onApprove, onReject }: {
  summary: string
  confidence: 'high' | 'medium'
  category: string
  onApprove: () => void
  onReject: () => void
}) {
  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
  return (
    <div className="border-t border-warning/30 bg-warning-bg/30 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-warning">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${confidence === 'high' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'}`}>
              {confidence === 'high' ? '高风险' : '中风险'}
            </span>
            <span className="text-[10px] text-content-subtle">{categoryLabel}</span>
          </div>
          <p className="mt-0.5 text-xs text-content-secondary truncate">{summary}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onReject}
            className="rounded-lg border border-border-default bg-surface-elevated px-3 py-1.5 text-xs font-medium text-content-muted transition-colors hover:bg-surface-inset"
          >
            拒绝
          </button>
          <button
            onClick={onApprove}
            className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success/80"
          >
            批准执行
          </button>
        </div>
      </div>
    </div>
  )
}

function ContextIndicator({ messages }: { messages: ChatMessage[] }) {
  const info = getContextUsageInfo(messages)
  if (info.messageCount === 0) return null

  const usagePercent = Math.min(100, Math.round((info.estimatedTokens / 10000) * 100))
  const barColor = usagePercent > 80 ? 'bg-danger' : usagePercent > 50 ? 'bg-warning' : 'bg-success'

  return (
    <div className="flex items-center gap-1.5" title={`${info.estimatedTokens} tokens · ${info.messageCount} 条消息`}>
      <div className="h-1 w-12 rounded-full bg-surface-inset overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${usagePercent}%` }} />
      </div>
      <span className="text-[10px] text-content-subtle">
        {info.estimatedTokens > 1000 ? `${(info.estimatedTokens / 1000).toFixed(1)}k` : info.estimatedTokens}
      </span>
    </div>
  )
}
