import { useState, useEffect } from 'react'
import type { WorkflowNode } from '../../../../shared/types'

interface Props {
  node: WorkflowNode
  onSave: (data: WorkflowNode['data']) => void
  onClose: () => void
  onDelete: () => void
}

export function WorkflowProperties({ node, onSave, onClose, onDelete }: Props) {
  const [label, setLabel] = useState(node.data.label)
  const [prompt, setPrompt] = useState(node.data.prompt || '')
  const [model, setModel] = useState(node.data.model || '')
  const [systemPrompt, setSystemPrompt] = useState(node.data.systemPrompt || '')
  const [condition, setCondition] = useState(node.data.condition || '')

  useEffect(() => {
    setLabel(node.data.label)
    setPrompt(node.data.prompt || '')
    setModel(node.data.model || '')
    setSystemPrompt(node.data.systemPrompt || '')
    setCondition(node.data.condition || '')
  }, [node.id, node.data])

  const handleSave = () => {
    const data: WorkflowNode['data'] = { label }
    if (node.type === 'agent') {
      data.prompt = prompt
      data.model = model
      data.systemPrompt = systemPrompt
    }
    if (node.type === 'condition') {
      data.condition = condition
    }
    onSave(data)
  }

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-72 border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <h3 className="text-xs font-medium text-zinc-300">节点属性</h3>
        <div className="flex gap-1">
          <button onClick={onDelete} className="rounded p-1 text-[10px] text-zinc-600 hover:text-red-400" title="删除节点">✕</button>
          <button onClick={onClose} className="rounded p-1 text-[10px] text-zinc-600 hover:text-zinc-300" title="关闭">✕</button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">名称</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">类型</label>
          <div className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-500">
            {node.type === 'start' ? '开始节点' : node.type === 'end' ? '结束节点' : node.type === 'condition' ? '条件判断' : 'Agent 节点'}
          </div>
        </div>

        {node.type === 'agent' && (
          <>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">系统提示词</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="该 Agent 的系统角色设定..."
                rows={3}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">用户提示词</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="发送给 AI 的消息内容，可使用 {{input}} 引用上游输出..."
                rows={4}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
              />
              <p className="mt-1 text-[10px] text-zinc-700">{'{{input}}'} = 上游节点输出 · {'{{$1}}'} = 指定节点输出</p>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">模型</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="留空使用默认模型"
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">条件表达式</label>
            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="例：output.length > 100&#10;例：output.includes('错误')&#10;评估上一节点的输出内容"
              rows={3}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500 resize-none"
            />
            <p className="mt-1 text-[10px] text-zinc-700">条件为真走"是"分支，否则走"否"分支</p>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
        >
          保存
        </button>
      </div>
    </div>
  )
}
