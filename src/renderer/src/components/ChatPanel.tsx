import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app'
import { SlashCommandMenu } from './SlashCommandMenu'
import type { SlashCommand } from './SlashCommandMenu'
import type { ChatMessage } from '../../../shared/types'
import { getExportContent, getExportFileName, type ExportFormat } from '../lib/export'
import { CATEGORY_LABELS } from '../lib/approvalDetection'
import { compressChatContext, getContextUsageInfo } from '../lib/contextManager'
import { genId } from '../lib/genId'
import { MessageBubble, ReasoningBlock } from './MessageBubble'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatExportDialog } from './ChatExportDialog'
import { ChatApprovalBar } from './ChatApprovalBar'
import { useChatStream } from '../hooks/useChatStream'

export function ChatPanel() {
  const {
    messages, isLoading, toolProgress, sessionId, reasoningContent, soulPrompt,
    addMessage, appendToLastAgent, setLoading, setToolProgress,
    clearMessages, setSessionId, setView, appendReasoning, clearReasoning, notify,
    chatApproval, respondChatApproval
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

  const isAiConfigMode = useAppStore((s) => s.isAiConfigMode)

  const { agentBufferRef, isStreamingRef } = useChatStream(
    appendToLastAgent, setLoading, setToolProgress, addMessage,
    appendReasoning, clearReasoning, notify,
    isAiConfigMode, sessionId
  )

  useEffect(() => {
    if (isStreamingRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

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
        id: genId('system-'), role: 'system',
        content: `✅ 已批准${categoryLabel}操作，AI 将继续执行`,
        timestamp: Date.now()
      })
      handleApprovalFollowUp('approved')
    } else {
      addMessage({
        id: genId('system-'), role: 'system',
        content: `❌ 已拒绝${categoryLabel}操作，AI 将取消执行`,
        timestamp: Date.now()
      })
      handleApprovalFollowUp('rejected')
    }
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
      id: genId('user-'), role: 'user', content: prompt, timestamp: Date.now()
    }
    addMessage(userMsg)
    setLoading(true)
    isStreamingRef.current = true
    agentBufferRef.current = ''

    const currentMessages = useAppStore.getState().messages
    const apiMsgs = [
      ...currentMessages.filter((m) => m.role !== 'system' && m.role !== 'error').map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content
      })),
      { role: 'user' as const, content: prompt }
    ]
    const soul = useAppStore.getState().soulPrompt
    const finalMsgs = soul ? [{ role: 'system', content: soul }, ...apiMsgs] : apiMsgs

    window.aiGui.chatSend({ messages: finalMsgs }).catch(() => {
      addMessage({ id: genId('error-'), role: 'error', content: '发送后续消息失败', timestamp: Date.now() })
      setLoading(false)
    })
  }, [addMessage, setLoading])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId
    const id = genId('session-')
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
      id: genId('user-'), role: 'user', content: text || '请描述这张图片',
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
  }, [input, isLoading, sessionId, pendingImage, addMessage, setLoading, appendToLastAgent, ensureSession, buildApiMessages])

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
          addMessage({ id: genId('system-'), role: 'system', content: '请先在 3D 视图添加项目组', timestamp: Date.now() })
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
          addMessage({ id: genId('system-'), role: 'system', content: `📋 ${member.name} 正在前往老板办公室提交审批...`, timestamp: Date.now() })
        }
        break
      }
      default: addMessage({ id: genId('system-'), role: 'system', content: `${cmd.label} — ${cmd.description}`, timestamp: Date.now() })
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
        {messages.length === 0 && <ChatEmptyState />}
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
        <ChatExportDialog
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
