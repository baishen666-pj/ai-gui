import { useState, useRef, useEffect } from 'react'
import type { ViewMode } from '../../../shared/types'
import { useAppStore } from '../stores/app'

interface SidebarProps {
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const NAV_ITEMS: { view: ViewMode; icon: string; labelZh: string }[] = [
  { view: 'chat', icon: '💬', labelZh: '聊天' },
  { view: 'canvas', icon: '🕸️', labelZh: '画布' },
  { view: '3d', icon: '🔮', labelZh: '3D' },
  { view: 'memory', icon: '🧠', labelZh: '记忆' },
  { view: 'tools', icon: '🔧', labelZh: '工具' },
  { view: 'schedule', icon: '⏰', labelZh: '定时' },
  { view: 'workflow', icon: '🔀', labelZh: '工作流' },
  { view: 'soul', icon: '🎭', labelZh: '角色' },
  { view: 'settings', icon: '⚙️', labelZh: '设置' }
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const profiles = useAppStore((s) => s.profiles)
  const activeProfileId = useAppStore((s) => s.activeProfileId)
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <aside className="flex h-full w-14 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3">
      {/* Logo / Profile switcher */}
      <div className="relative mb-4" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-xs font-bold text-indigo-400 transition-colors hover:bg-indigo-600/30"
          title={activeProfile.name}
        >
          {activeProfile.name.slice(0, 1)}
        </button>

        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>

      {/* Navigation */}
      {NAV_ITEMS.map(({ view, icon, labelZh }) => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          title={labelZh}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors ${
            activeView === view
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
        >
          {icon}
        </button>
      ))}
    </aside>
  )
}

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const profiles = useAppStore((s) => s.profiles)
  const activeProfileId = useAppStore((s) => s.activeProfileId)
  const switchProfile = useAppStore((s) => s.switchProfile)
  const createProfile = useAppStore((s) => s.createProfile)
  const deleteProfile = useAppStore((s) => s.deleteProfile)
  const renameProfile = useAppStore((s) => s.renameProfile)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    createProfile(newName.trim())
    setCreating(false)
    setNewName('')
    onClose()
  }

  const handleRename = (id: string) => {
    if (!editName.trim()) { setEditingId(null); return }
    renameProfile(id, editName.trim())
    setEditingId(null)
  }

  return (
    <div className="absolute left-14 top-0 z-50 w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl">
      <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        配置文件
      </div>

      {profiles.map((p) => (
        <div key={p.id} className="group flex items-center gap-1">
          {editingId === p.id ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRename(p.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(p.id)}
              className="flex-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
            />
          ) : (
            <button
              onClick={() => { switchProfile(p.id); onClose() }}
              className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                activeProfileId === p.id
                  ? 'bg-indigo-600/15 text-indigo-300'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold">
                {p.name.slice(0, 1)}
              </span>
              <span className="flex-1 truncate">{p.name}</span>
              {activeProfileId === p.id && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </button>
          )}

          {editingId !== p.id && (
            <div className="hidden gap-0.5 group-hover:flex">
              <button
                onClick={() => { setEditingId(p.id); setEditName(p.name) }}
                className="rounded p-0.5 text-[10px] text-zinc-600 hover:text-zinc-300"
                title="重命名"
              >
                ✎
              </button>
              {profiles.length > 1 && (
                <button
                  onClick={() => { deleteProfile(p.id) }}
                  className="rounded p-0.5 text-[10px] text-zinc-600 hover:text-red-400"
                  title="删除"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {creating ? (
        <div className="mt-1 flex gap-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="名称..."
            className="flex-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none"
          />
          <button onClick={handleCreate} className="text-xs text-indigo-400">✓</button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400"
        >
          + 新建配置文件
        </button>
      )}
    </div>
  )
}
