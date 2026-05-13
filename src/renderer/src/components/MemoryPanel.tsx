import { genId } from '../lib/genId'
import { useState } from 'react'

interface MemoryEntry {
  id: string
  content: string
  timestamp: number
  type: 'fact' | 'preference' | 'context' | 'instruction'
}

const MOCK_MEMORIES: MemoryEntry[] = [
  { id: 'm1', content: '用户偏好简体中文交流', timestamp: Date.now() - 86400000, type: 'preference' },
  { id: 'm2', content: '项目使用 React 19 + Electron 39 + Three.js 技术栈', timestamp: Date.now() - 72000000, type: 'fact' },
  { id: 'm3', content: '当前任务：实现多Agent桌面工作台的 3D 可视化层', timestamp: Date.now() - 36000000, type: 'context' },
  { id: 'm4', content: '代码风格偏好：不可变数据、小文件高内聚、无 console.log', timestamp: Date.now() - 18000000, type: 'instruction' },
  { id: 'm5', content: 'Agent 画布使用 React Flow 实现拓扑可视化', timestamp: Date.now() - 7200000, type: 'fact' },
  { id: 'm6', content: 'SSE 流式解析器已从 Hermes Desktop 移植完成', timestamp: Date.now() - 3600000, type: 'context' }
]

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  fact: { label: '事实', color: 'bg-blue-500/20 text-blue-400' },
  preference: { label: '偏好', color: 'bg-purple-500/20 text-purple-400' },
  context: { label: '上下文', color: 'bg-warning-bg text-warning' },
  instruction: { label: '指令', color: 'bg-success-bg text-success' }
}

export function MemoryPanel() {
  const [memories, setMemories] = useState<MemoryEntry[]>(MOCK_MEMORIES)
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<MemoryEntry['type']>('fact')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleAdd = () => {
    if (!newContent.trim()) return
    const entry: MemoryEntry = {
      id: genId('m-'),
      content: newContent.trim(),
      timestamp: Date.now(),
      type: newType
    }
    setMemories((prev) => [entry, ...prev])
    setNewContent('')
  }

  const handleDelete = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  const handleEdit = (entry: MemoryEntry) => {
    setEditingId(entry.id)
    setEditContent(entry.content)
  }

  const handleSave = (id: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: editContent } : m))
    )
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border-subtle px-4 py-2">
        <h2 className="text-sm font-medium text-content-heading">记忆管理</h2>
      </header>

      <div className="border-b border-border-subtle p-3">
        <div className="flex gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as MemoryEntry['type'])}
            className="rounded border border-border-default bg-surface-overlay px-2 py-1.5 text-xs text-content-muted"
          >
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="添加新记忆..."
            className="flex-1 rounded border border-border-default bg-surface-elevated px-3 py-1.5 text-sm text-content-secondary placeholder-content-subtle outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            disabled={!newContent.trim()}
            className="rounded bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            添加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {memories.map((entry) => {
            const tc = TYPE_CONFIG[entry.type]
            return (
              <div
                key={entry.id}
                className="group rounded-lg border border-border-subtle bg-surface-elevated p-3 transition-colors hover:border-border-default"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {editingId === entry.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(entry.id)}
                          className="flex-1 rounded border border-accent bg-surface-overlay px-2 py-1 text-sm text-content-secondary outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(entry.id)}
                          className="rounded bg-accent px-2 py-1 text-xs text-white"
                        >
                          保存
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-content-heading">{entry.content}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tc.color}`}>
                            {tc.label}
                          </span>
                          <span className="text-[10px] text-content-subtle">
                            {new Date(entry.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== entry.id && (
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="rounded p-1 text-xs text-content-subtle hover:bg-surface-overlay hover:text-content-muted"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded p-1 text-xs text-content-subtle hover:bg-surface-overlay hover:text-danger"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border-subtle px-4 py-2">
        <p className="text-xs text-content-subtle">
          共 {memories.length} 条记忆 — 本地模拟数据，接入后端后自动同步
        </p>
      </div>
    </div>
  )
}
