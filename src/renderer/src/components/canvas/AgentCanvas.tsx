import { genId } from '../../lib/genId'
import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type DefaultEdgeOptions,
  type Node,
  type Edge,
  type NodeMouseHandler
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AgentNodeComponent } from './AgentNode'
import { AgentEditPanel } from './AgentEditPanel'
import { AIConfigDialog } from './AIConfigDialog'
import { TEMPLATES } from './templates'
import type { AgentNodeData, FlowTemplate } from './types'
import { useAppStore } from '../../stores/app'
import type { CanvasAgent } from '../../stores/app'

const nodeTypes = { agent: AgentNodeComponent }

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: 'var(--t-border-default)', strokeWidth: 1.5 },
  labelStyle: { fill: 'var(--t-content-subtle)', fontSize: 11 },
  labelBgStyle: { fill: 'var(--t-surface-elevated)', fillOpacity: 0.9 },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 4,
  markerEnd: { type: 'arrowclosed' as const, color: 'var(--t-border-default)' }
}

export function AgentCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [aiConfigOpen, setAiConfigOpen] = useState(false)
  const syncTimerRef = useRef<number>(0)
  const setCanvasAgents = useAppStore((s) => s.setCanvasAgents)

  const syncToStore = useCallback((nds: Node[], eds: Edge[]) => {
    const agents: CanvasAgent[] = nds.map((n) => {
      const d = n.data as AgentNodeData
      return {
        id: n.id,
        label: (d.label as string) || 'Agent',
        role: (d.role as string) || '',
        model: (d.model as string) || 'gpt-4o',
        color: (d.color as string) || '#6366f1',
        position: n.position,
        connections: eds.filter((e) => e.source === n.id).map((e) => e.target),
        tools: (d.tools as string[]) || [],
        status: (d.status as CanvasAgent['status']) || 'idle'
      }
    })
    setCanvasAgents(agents)
  }, [setCanvasAgents])

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const updated = addEdge({ ...params, data: { animated: true } }, eds)
        setNodes((currentNodes) => {
          syncToStore(currentNodes, updated)
          return currentNodes
        })
        return updated
      })
    },
    [setEdges, setNodes, syncToStore]
  )

  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    setEditingNodeId(node.id)
  }, [])

  const loadTemplate = useCallback(
    (templateId: string) => {
      const tpl = TEMPLATES.find((t) => t.id === templateId)
      if (!tpl) return

      const newNodes: Node[] = tpl.nodes.map((n, i) => ({
        id: `agent-${i}`,
        type: 'agent',
        position: { x: 300 + n.position.x, y: 80 + n.position.y },
        data: { ...n.data }
      }))

      const newEdges: Edge[] = tpl.edges.map((e, i) => ({
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        data: e.data
      }))

      setNodes(newNodes)
      setEdges(newEdges)
      syncToStore(newNodes, newEdges)
    },
    [setNodes, setEdges, syncToStore]
  )

  const addAgent = useCallback(() => {
    const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#ef4444']
    const newNode: Node = {
      id: genId('agent-'),
      type: 'agent',
      position: { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: '新 Agent',
        role: '自定义 Agent',
        model: 'gpt-4o',
        status: 'idle',
        color: colors[Math.floor(Math.random() * colors.length)],
        tools: []
      } satisfies AgentNodeData
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      syncToStore(updated, edges)
      return updated
    })
  }, [setNodes, edges, syncToStore])

  const loadFlowTemplate = useCallback((tpl: FlowTemplate) => {
    const newNodes: Node[] = tpl.nodes.map((n, i) => ({
      id: `agent-${i}`,
      type: 'agent',
      position: { x: 300 + n.position.x, y: 80 + n.position.y },
      data: { ...n.data }
    }))
    const newEdges: Edge[] = tpl.edges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
      data: e.data
    }))
    setNodes(newNodes)
    setEdges(newEdges)
    syncToStore(newNodes, newEdges)
  }, [setNodes, setEdges, syncToStore])

  const handleSaveNode = useCallback((nodeId: string, newData: AgentNodeData) => {
    setNodes((nds) => {
      const updated = nds.map((n) => (n.id === nodeId ? { ...n, data: { ...newData } } : n))
      syncToStore(updated, edges)
      return updated
    })
  }, [setNodes, edges, syncToStore])

  const onNodesChangeWrapped = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes)
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = window.setTimeout(() => {
      setNodes((currentNodes) => {
        syncToStore(currentNodes, edges)
        return currentNodes
      })
    }, 150)
  }, [onNodesChange, edges, syncToStore, setNodes])

  const minimapNodeColor = useCallback((node: Node) => {
    return (node.data as AgentNodeData)?.color || '#6366f1'
  }, [])

  const isEmpty = nodes.length === 0
  const editingNode = nodes.find((n) => n.id === editingNodeId)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <h2 className="text-sm font-medium text-content-heading">Agent 画布</h2>
        <div className="flex items-center gap-1">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => loadTemplate(tpl.id)}
              title={tpl.description}
              className="rounded px-2 py-1 text-xs text-content-subtle transition-colors hover:bg-surface-overlay hover:text-content-heading"
            >
              {tpl.name}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-surface-overlay" />
          <button
            onClick={() => setAiConfigOpen(true)}
            className="rounded px-2 py-1 text-xs text-accent-text transition-colors hover:bg-accent/10"
            title="AI 智能配置"
          >
            ✨ AI 配置
          </button>
          <button
            onClick={addAgent}
            className="rounded bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            + Agent
          </button>
        </div>
      </header>

      <div className="relative flex-1">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-4xl">🕸️</div>
              <p className="mb-4 text-sm text-content-subtle">选择模板或添加 Agent 开始构建工作流</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl.id)}
                    className="rounded-lg border border-border-default bg-surface-elevated px-4 py-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-overlay"
                  >
                    <div className="text-sm font-medium text-content-heading">{tpl.name}</div>
                    <div className="mt-1 text-xs text-content-subtle">{tpl.description}</div>
                    <div className="mt-2 text-xs text-content-subtle">
                      {tpl.nodes.length} Agents / {tpl.edges.length} 连接
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWrapped}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="bg-surface-base"
            proOptions={{ hideAttribution: true }}
          >
            <Controls
              className="!border-border-default !bg-surface-elevated [&>button]:!border-border-default [&>button]:!bg-surface-overlay [&>button]:!fill-content-muted [&>button:hover]:!bg-surface-inset"
            />
            <MiniMap
              nodeColor={minimapNodeColor}
              className="!border-border-default !bg-surface-elevated"
              maskColor="rgba(0,0,0,0.7)"
            />
            <Background color="var(--t-border-subtle)" gap={20} size={1} />
          </ReactFlow>
        )}

        {editingNode && (
          <AgentEditPanel
            data={editingNode.data as AgentNodeData}
            onSave={(data) => handleSaveNode(editingNode.id, data)}
            onClose={() => setEditingNodeId(null)}
          />
        )}
      </div>

      <AIConfigDialog
        open={aiConfigOpen}
        onClose={() => setAiConfigOpen(false)}
        onApply={loadFlowTemplate}
      />
    </div>
  )
}
