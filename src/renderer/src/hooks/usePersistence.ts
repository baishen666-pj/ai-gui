import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/app'
import type { ScheduleTask, Workflow, WorkflowNode, WorkflowEdge } from '../../../shared/types'

interface TaskRow {
  id: string
  name: string
  prompt: string
  interval_seconds: number
  enabled: number
  last_run_at: number | null
  next_run_at: number | null
  run_count: number
  created_at: number
}

interface WorkflowRow {
  id: string
  name: string
  description: string
  nodes: string
  edges: string
  created_at: number
  updated_at: number
}

function rowToTask(row: TaskRow): ScheduleTask {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    intervalSeconds: row.interval_seconds,
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    runCount: row.run_count,
    createdAt: row.created_at
  }
}

function taskToRow(task: ScheduleTask): TaskRow {
  return {
    id: task.id,
    name: task.name,
    prompt: task.prompt,
    interval_seconds: task.intervalSeconds,
    enabled: task.enabled ? 1 : 0,
    last_run_at: task.lastRunAt,
    next_run_at: task.nextRunAt,
    run_count: task.runCount,
    created_at: task.createdAt
  }
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    nodes: JSON.parse(row.nodes) as WorkflowNode[],
    edges: JSON.parse(row.edges) as WorkflowEdge[],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function workflowToRow(wf: Workflow): WorkflowRow {
  return {
    id: wf.id,
    name: wf.name,
    description: wf.description,
    nodes: JSON.stringify(wf.nodes),
    edges: JSON.stringify(wf.edges),
    created_at: wf.createdAt,
    updated_at: wf.updatedAt
  }
}

export function usePersistence() {
  const loaded = useRef(false)

  // Load on mount
  useEffect(() => {
    if (loaded.current || !window.aiGui) return
    loaded.current = true

    const store = useAppStore.getState()

    // Load tasks
    window.aiGui.persistenceGetTasks().then((rows: TaskRow[]) => {
      if (rows && rows.length > 0) {
        const tasks = rows.map(rowToTask)
        useAppStore.setState({ scheduledTasks: tasks })
      }
    }).catch(() => {})

    // Load workflows
    window.aiGui.persistenceGetWorkflows().then((rows: WorkflowRow[]) => {
      if (rows && rows.length > 0) {
        const workflows = rows.map(rowToWorkflow)
        useAppStore.setState({ workflows })
      }
    }).catch(() => {})
  }, [])

  // Auto-save tasks on change
  const tasks = useAppStore((s) => s.scheduledTasks)
  const prevTaskIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!window.aiGui) return

    const currentIds = new Set(tasks.map((t) => t.id))

    // Detect deleted tasks
    for (const id of prevTaskIds.current) {
      if (!currentIds.has(id)) {
        window.aiGui.persistenceDeleteTask(id).catch(() => {})
      }
    }

    // Upsert all current tasks
    for (const task of tasks) {
      window.aiGui.persistenceUpsertTask(taskToRow(task)).catch(() => {})
    }

    prevTaskIds.current = currentIds
  }, [tasks])

  // Auto-save workflows on change
  const workflows = useAppStore((s) => s.workflows)
  const prevWfIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!window.aiGui) return

    const currentIds = new Set(workflows.map((w) => w.id))

    // Detect deleted workflows
    for (const id of prevWfIds.current) {
      if (!currentIds.has(id)) {
        window.aiGui.persistenceDeleteWorkflow(id).catch(() => {})
      }
    }

    // Upsert all current workflows
    for (const wf of workflows) {
      window.aiGui.persistenceUpsertWorkflow(workflowToRow(wf)).catch(() => {})
    }

    prevWfIds.current = currentIds
  }, [workflows])
}
