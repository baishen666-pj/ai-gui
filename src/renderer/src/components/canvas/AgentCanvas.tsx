import { useCallback, useState } from 'react'
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
import { TEMPLATES } from './templates'
import type { AgentNodeData } from './types'
import { useAppStore } from '../../stores/app'
import type { CanvasAgent } from '../../stores/app'

const nodeTypes = { agent: AgentNodeComponent }

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#52525b', strokeWidth: 1.5 },
  labelStyle: { fill: '#71717a', fontSize: 11 },
  labelBgStyle: { fill: '#18181b', fillOpacity: 0.9 },
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 4,
  markerEnd: { type: 'arrowclosed' as const, color: '#52525b' }
}

export function AgentCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const setCanvasAgents = useAppStore((s) => s.setCanvasAgents)

  const syncToStore = useCallback((nds: Node[], eds: Edge[]) => {
    const agents: CanvasAgent[] = nds.map((n) => {
      const d = n.data as AgentNodeData
      return {
        id: n.id,
        label: (d.label as string) || 'Agent',
        color: (d.color as string) || '#6366f1',
        position: n.position,
        connections: eds.filter((e) => e.source === n.id).map((e) => e.target)
      }
    })
    setCanvasAgents(agents)
  }, [setCanvasAgents])

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, data: { animated: true } }, eds)),
    [setEdges]
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
      id: `agent-${Date.now()}`,
      type: 'agent',
      position: { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: 'New Agent',
        role: '自定义 Agent',
        model: 'gpt-4',
        status: 'idle',
        color: colors[Math.floor(Math.random() * colors.length)],
        tools: []
      } satisfies AgentNodeData
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const handleSaveNode = useCallback((nodeId: string, newData: AgentNodeData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...newData } } : n))
    )
  }, [setNodes])

  const minimapNodeColor = useCallback((node: Node) => {
    return (node.data as AgentNodeData)?.color || '#6366f1'
  }, [])

  const isEmpty = nodes.length === 0
  const editingNode = nodes.find((n) => n.id === editingNodeId)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <h2 className="text-sm font-medium text-zinc-300">Agent Canvas</h2>
        <div className="flex items-center gap-1">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => loadTemplate(tpl.id)}
              title={tpl.description}
              className="rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              {tpl.name}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <button
            onClick={addAgent}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
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
              <p className="mb-4 text-sm text-zinc-500">选择模板或添加 Agent 开始构建工作流</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl.id)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-indigo-500/50 hover:bg-zinc-800"
                  >
                    <div className="text-sm font-medium text-zinc-300">{tpl.name}</div>
                    <div className="mt-1 text-xs text-zinc-600">{tpl.description}</div>
                    <div className="mt-2 text-xs text-zinc-600">
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
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="bg-zinc-950"
            proOptions={{ hideAttribution: true }}
          >
            <Controls
              className="!border-zinc-700 !bg-zinc-900 [&>button]:!border-zinc-700 [&>button]:!bg-zinc-800 [&>button]:!fill-zinc-400 [&>button:hover]:!bg-zinc-700"
            />
            <MiniMap
              nodeColor={minimapNodeColor}
              className="!border-zinc-700 !bg-zinc-900"
              maskColor="rgba(0,0,0,0.7)"
            />
            <Background color="#27272a" gap={20} size={1} />
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
    </div>
  )
}
