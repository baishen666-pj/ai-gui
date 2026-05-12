import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { WorkflowNode } from '../../../../shared/types'

type WFNodeData = WorkflowNode['data'] & { executionStatus?: string }

const STATUS_COLORS: Record<string, string> = {
  idle: 'border-border-default bg-surface-elevated',
  running: 'border-amber-500 bg-amber-950/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  completed: 'border-emerald-500 bg-emerald-950/40',
  failed: 'border-red-500 bg-red-950/40',
  skipped: 'border-border-default bg-surface-elevated/50'
}

export const StartNode = memo(({ data }: NodeProps) => {
  return (
    <div className={`flex h-10 min-w-[100px] items-center justify-center rounded-lg border-2 border-emerald-600 bg-emerald-950/40 px-4 text-xs font-medium text-emerald-400`}>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !border-emerald-700 !w-2 !h-2" />
      {(data as WFNodeData).label || '开始'}
    </div>
  )
})
StartNode.displayName = 'StartNode'

export const AgentWorkflowNode = memo(({ data, selected }: NodeProps) => {
  const d = data as WFNodeData
  const status = d.executionStatus || 'idle'
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.idle

  return (
    <div className={`min-w-[160px] rounded-lg border-2 px-3 py-2 transition-all ${statusColor} ${selected ? 'ring-1 ring-accent' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-content-subtle !border-border-default !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/20 text-[10px] text-accent-text">
          AI
        </span>
        <span className="text-xs font-medium text-content-secondary">{d.label || 'Agent'}</span>
        {status === 'running' && (
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        )}
      </div>

      {d.model && (
        <div className="mt-1 text-[10px] text-content-subtle">{d.model}</div>
      )}

      {d.prompt && (
        <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-content-subtle">
          {d.prompt}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-content-subtle !border-border-default !w-2 !h-2" />
    </div>
  )
})
AgentWorkflowNode.displayName = 'AgentWorkflowNode'

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const d = data as WFNodeData
  const status = d.executionStatus || 'idle'
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.idle

  return (
    <div className={`min-w-[140px] rounded-lg border-2 px-3 py-2 transition-all ${statusColor} ${selected ? 'ring-1 ring-accent' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-content-subtle !border-border-default !w-2 !h-2" />

      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-600/20 text-[10px] text-amber-400">
          ?
        </span>
        <span className="text-xs font-medium text-content-secondary">{d.label || '条件'}</span>
      </div>

      {d.condition && (
        <div className="mt-1 text-[10px] text-content-subtle">{d.condition}</div>
      )}

      <Handle
        type="source" position={Position.Bottom} id="yes"
        className="!bg-emerald-500 !border-emerald-700 !w-2 !h-2"
        style={{ left: '30%' }}
      />
      <Handle
        type="source" position={Position.Bottom} id="no"
        className="!bg-red-500 !border-red-700 !w-2 !h-2"
        style={{ left: '70%' }}
      />

      <div className="mt-1 flex justify-between px-1 text-[9px]">
        <span className="text-emerald-500">是</span>
        <span className="text-red-500">否</span>
      </div>
    </div>
  )
})
ConditionNode.displayName = 'ConditionNode'

export const EndNode = memo(({ data }: NodeProps) => {
  return (
    <div className="flex h-10 min-w-[100px] items-center justify-center rounded-lg border-2 border-red-600 bg-red-950/40 px-4 text-xs font-medium text-red-400">
      <Handle type="target" position={Position.Top} className="!bg-red-500 !border-red-700 !w-2 !h-2" />
      {(data as WFNodeData).label || '结束'}
    </div>
  )
})
EndNode.displayName = 'EndNode'

export const workflowNodeTypes = {
  start: StartNode,
  agent: AgentWorkflowNode,
  condition: ConditionNode,
  end: EndNode
}
