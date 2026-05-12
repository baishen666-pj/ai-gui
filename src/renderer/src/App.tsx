import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAppStore } from './stores/app'
import type { ViewMode } from '../../shared/types'
import { Sidebar } from './components/Sidebar'
import { ChatPanel } from './components/ChatPanel'
import { SessionSidebar } from './components/SessionSidebar'
import { AgentCanvas } from './components/canvas/AgentCanvas'
import { AgentGraph3D } from './components/three/AgentGraph3D'
import { MemoryPanel } from './components/MemoryPanel'
import { ToolsPanel } from './components/ToolsPanel'
import { SoulEditorPanel } from './components/SoulEditorPanel'
import { SettingsPanel } from './components/SettingsPanel'

const VIEW_KEYS: Record<number, ViewMode> = {
  1: 'chat',
  2: 'canvas',
  3: '3d',
  4: 'memory',
  5: 'tools',
  6: 'soul',
  7: 'settings'
}

export function App() {
  const { view, setView, clearMessages } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 7 && VIEW_KEYS[num]) {
          e.preventDefault()
          setView(VIEW_KEYS[num])
        }
        if (e.key === 'n') {
          e.preventDefault()
          clearMessages()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setView, clearMessages])

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar activeView={view} onViewChange={setView} />
      <main className="flex-1 overflow-hidden">
        {view === 'chat' && <ChatView />}
        {view === 'canvas' && (
          <ReactFlowProvider>
            <AgentCanvas />
          </ReactFlowProvider>
        )}
        {view === '3d' && <AgentGraph3D />}
        {view === 'memory' && <MemoryPanel />}
        {view === 'tools' && <ToolsPanel />}
        {view === 'soul' && <SoulEditorPanel />}
        {view === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

function ChatView() {
  const { sessionId, setSessionId, clearMessages } = useAppStore()

  const handleNewChat = () => {
    clearMessages()
  }

  const handleSelectSession = async (id: string) => {
    if (!window.aiGui) return
    try {
      const msgs = await window.aiGui.sessionsGetMessages(id) as { id: string; role: string; content: string; timestamp: number }[]
      clearMessages()
      setSessionId(id)
      for (const m of msgs) {
        useAppStore.getState().addMessage({
          id: m.id,
          role: m.role as 'user' | 'agent' | 'system' | 'error',
          content: m.content,
          timestamp: m.timestamp
        })
      }
    } catch {
      // session not found
    }
  }

  return (
    <div className="flex h-full">
      <SessionSidebar
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
      />
      <div className="flex-1">
        <ChatPanel />
      </div>
    </div>
  )
}
