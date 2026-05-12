import { useCallback, useRef } from 'react'
import { useAppStore } from '../../stores/app'
import type { Workflow, WorkflowNode, WorkflowEdge } from '../../../../shared/types'

interface Props {
  workflow: Workflow
}

export function WorkflowExecutor({ workflow }: Props) {
  const { workflowExecution, startWorkflowExecution, updateNodeExecution, completeWorkflowExecution, addMessage, soulPrompt, notify } = useAppStore()
  const isRunning = workflowExecution?.status === 'running' && workflowExecution?.workflowId === workflow.id
  const abortRef = useRef(false)

  const evaluateCondition = (condition: string, output: string): boolean => {
    if (!condition) return true
    try {
      const fn = new Function('output', `"use strict"; return ${condition}`)
      return !!fn(output)
    } catch {
      return output.length > 0
    }
  }

  const resolvePrompt = (template: string, outputs: Record<string, string>, input: string): string => {
    let result = template.replace(/\{\{input\}\}/g, input)
    result = result.replace(/\{\{\$(\w+)\}\}/g, (_, id) => outputs[id] || '')
    return result
  }

  const callAgent = async (node: WorkflowNode, prompt: string): Promise<string> => {
    if (!window.aiGui) {
      return `[模拟] Agent "${node.data.label}" 回复: 收到指令「${prompt.slice(0, 50)}...」`
    }

    return new Promise((resolve) => {
      let buffer = ''
      const msgs: { role: string; content: string }[] = []

      if (soulPrompt) msgs.push({ role: 'system', content: soulPrompt })
      if (node.data.systemPrompt) msgs.push({ role: 'system', content: node.data.systemPrompt })
      msgs.push({ role: 'user', content: prompt })

      const unsubChunk = window.aiGui.onChatChunk((chunk: string) => { buffer += chunk })
      const unsubDone = window.aiGui.onChatDone(() => {
        unsubChunk()
        unsubDone()
        unsubError()
        resolve(buffer)
      })
      const unsubError = window.aiGui.onChatError((msg: string) => {
        unsubChunk()
        unsubDone()
        unsubError()
        resolve(`[错误] ${msg}`)
      })

      window.aiGui.chatSend({ messages: msgs, model: node.data.model || undefined }).catch(() => {
        resolve('[错误] 请求失败')
      })
    })
  }

  const run = useCallback(async () => {
    abortRef.current = false
    const { nodes, edges } = workflow
    const startNode = nodes.find((n) => n.type === 'start')
    if (!startNode) {
      addMessage({ id: `error-${Date.now()}`, role: 'error', content: '工作流缺少开始节点', timestamp: Date.now() })
      return
    }

    startWorkflowExecution(workflow.id)
    const outputs: Record<string, string> = {}
    let input = ''

    addMessage({
      id: `system-${Date.now()}`, role: 'system',
      content: `🔀 工作流「${workflow.name}」开始执行`,
      timestamp: Date.now()
    })

    const getOutgoingEdges = (nodeId: string) => edges.filter((e) => e.source === nodeId)

    const processNode = async (node: WorkflowNode, currentInput: string): Promise<void> => {
      if (abortRef.current) return

      if (node.type === 'start') {
        updateNodeExecution(node.id, 'completed')
        const outEdges = getOutgoingEdges(node.id)
        for (const edge of outEdges) {
          const target = nodes.find((n) => n.id === edge.target)
          if (target) await processNode(target, '')
        }
        return
      }

      if (node.type === 'end') {
        updateNodeExecution(node.id, 'completed')
        return
      }

      if (node.type === 'condition') {
        updateNodeExecution(node.id, 'running')
        const result = evaluateCondition(node.data.condition || '', currentInput)

        addMessage({
          id: `system-${Date.now()}`, role: 'system',
          content: `? 条件「${node.data.label}」: ${result ? '是' : '否'}`,
          timestamp: Date.now()
        })

        updateNodeExecution(node.id, 'completed')
        const handle = result ? 'yes' : 'no'
        const outEdges = getOutgoingEdges(node.id)
        const matchedEdge = outEdges.find((e) => e.sourceHandle === handle) || outEdges[0]
        if (matchedEdge) {
          const target = nodes.find((n) => n.id === matchedEdge.target)
          if (target) await processNode(target, currentInput)
        }
        return
      }

      if (node.type === 'agent') {
        updateNodeExecution(node.id, 'running')
        const prompt = node.data.prompt
          ? resolvePrompt(node.data.prompt, outputs, currentInput)
          : currentInput || '请执行任务'

        addMessage({
          id: `system-${Date.now()}`, role: 'system',
          content: `▶ Agent「${node.data.label}」执行中...`,
          timestamp: Date.now()
        })

        const output = await callAgent(node, prompt)
        outputs[node.id] = output
        updateNodeExecution(node.id, 'completed', output)

        addMessage({
          id: `agent-${Date.now()}`, role: 'agent',
          content: `**${node.data.label}**: ${output}`,
          timestamp: Date.now()
        })

        const outEdges = getOutgoingEdges(node.id)
        const parallelPromises = outEdges.map(async (edge) => {
          const target = nodes.find((n) => n.id === edge.target)
          if (target) await processNode(target, output)
        })
        await Promise.all(parallelPromises)
      }
    }

    try {
      await processNode(startNode, input)
      completeWorkflowExecution(abortRef.current ? 'failed' : 'completed')

      if (!abortRef.current) {
        notify('工作流完成', `「${workflow.name}」执行成功`)
      }

      addMessage({
        id: `system-${Date.now()}`, role: 'system',
        content: abortRef.current ? `⚠ 工作流「${workflow.name}」已中止` : `✓ 工作流「${workflow.name}」执行完成`,
        timestamp: Date.now()
      })
    } catch {
      completeWorkflowExecution('failed')
      notify('工作流失败', `「${workflow.name}」执行出错`)
      addMessage({
        id: `error-${Date.now()}`, role: 'error',
        content: `工作流执行失败`,
        timestamp: Date.now()
      })
    }
  }, [workflow, startWorkflowExecution, updateNodeExecution, completeWorkflowExecution, addMessage, soulPrompt])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  return (
    <>
      {isRunning ? (
        <button
          onClick={abort}
          className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
        >
          停止
        </button>
      ) : (
        <button
          onClick={run}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          ▶ 运行
        </button>
      )}
    </>
  )
}
