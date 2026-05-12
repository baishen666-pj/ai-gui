import type { AgentOfficeState } from './types'
import { ACTIVITY_COLORS } from './constants'

interface AgentInfoPanelProps {
  agent: AgentOfficeState
  onClose: () => void
}

const ACTIVITY_LABELS: Record<string, string> = {
  idle: '空闲',
  working: '工作中',
  meeting: '会议中',
  walking: '移动中'
}

export function AgentInfoPanel({ agent, onClose }: AgentInfoPanelProps) {
  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-50 w-64 rounded-xl border border-zinc-700 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <span className="text-sm font-semibold text-zinc-100">{agent.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">状态</span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: ACTIVITY_COLORS[agent.activity] ?? '#71717a' }}
            />
            <span className="text-zinc-300">{ACTIVITY_LABELS[agent.activity] ?? '未知'}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">ID</span>
          <span className="font-mono text-zinc-400">{agent.id}</span>
        </div>
      </div>
    </div>
  )
}
