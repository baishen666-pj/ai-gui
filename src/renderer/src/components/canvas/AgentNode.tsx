import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { AgentNodeData } from './types'

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-zinc-500',
  running: 'bg-amber-400 animate-pulse',
  error: 'bg-red-500',
  success: 'bg-emerald-400'
}

export function AgentNodeComponent({ data: rawData, selected }: NodeProps) {
  const data = rawData as AgentNodeData
  return (
    <div
      className={`group relative min-w-[140px] rounded-xl border bg-zinc-900 p-3 shadow-lg transition-all ${
        selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-zinc-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-600 !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: data.color as string }}
        >
          {(data.label as string).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-zinc-200">{data.label as string}</span>
            <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[data.status as string]}`} />
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{data.role as string}</p>
        </div>
      </div>

      {data.model && (
        <div className="mt-2 text-xs text-zinc-600">
          {data.model as string}
        </div>
      )}

      {(data.tools as string[]).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(data.tools as string[]).slice(0, 3).map((tool) => (
            <span key={tool} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {tool}
            </span>
          ))}
          {(data.tools as string[]).length > 3 && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600">
              +{(data.tools as string[]).length - 3}
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-600 !w-2 !h-2" />
    </div>
  )
}
