import type { ViewMode } from '../../../shared/types'

interface SidebarProps {
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const NAV_ITEMS: { view: ViewMode; icon: string; labelZh: string; labelEn: string }[] = [
  { view: 'chat', icon: '💬', labelZh: '聊天', labelEn: 'Chat' },
  { view: 'canvas', icon: '🕸️', labelZh: '画布', labelEn: 'Canvas' },
  { view: '3d', icon: '🔮', labelZh: '3D', labelEn: '3D' },
  { view: 'memory', icon: '🧠', labelZh: '记忆', labelEn: 'Memory' },
  { view: 'tools', icon: '🔧', labelZh: '工具', labelEn: 'Tools' },
  { view: 'soul', icon: '🎭', labelZh: '角色', labelEn: 'Soul' },
  { view: 'settings', icon: '⚙️', labelZh: '设置', labelEn: 'Settings' }
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-14 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3">
      <div className="mb-4 text-lg font-bold text-indigo-400">AI</div>
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
