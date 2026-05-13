import { useThemeStore } from './themeStore'
import { useScheduleStore } from './scheduleStore'
import { useWorkflowStore } from './workflowStore'
import { useOfficeStore } from './officeStore'
import { useChatStore } from './chatStore'
import { useProfileStore } from './profileStore'

export type { ThemeMode } from './themeStore'
export type { ChatApprovalRequest } from './chatStore'
export type { TeamRole, TeamMember, ProjectRoom, ApprovalRequest } from './officeStore'
export type { CanvasAgent, Profile } from './profileStore'

import type { ThemeMode } from './themeStore'
import type { ChatApprovalRequest } from './chatStore'
import type { TeamRole, TeamMember, ProjectRoom, ApprovalRequest } from './officeStore'
import type { CanvasAgent, Profile } from './profileStore'
import type { ChatMessage, ViewMode, ScheduleTask, Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, NodeExecutionStatus } from '../../../shared/types'
import type { LayoutItem } from '../components/three/types'

export interface AppState {
  theme: ThemeMode
  view: ViewMode
  messages: ChatMessage[]
  isLoading: boolean
  toolProgress: string | null
  sessionId: string | null
  canvasAgents: CanvasAgent[]
  reasoningContent: string
  officeLayout: LayoutItem[]
  soulPrompt: string
  profiles: Profile[]
  activeProfileId: string
  scheduledTasks: ScheduleTask[]
  workflows: Workflow[]
  activeWorkflowId: string | null
  workflowExecution: WorkflowExecution | null
  isAiConfigMode: boolean
  projectRooms: ProjectRoom[]
  approvalRequests: ApprovalRequest[]
  chatApproval: ChatApprovalRequest | null

  setView: (view: ViewMode) => void
  addMessage: (msg: ChatMessage) => void
  appendToLastAgent: (chunk: string) => void
  setLoading: (loading: boolean) => void
  setToolProgress: (tool: string | null) => void
  setSessionId: (id: string | null) => void
  setCanvasAgents: (agents: CanvasAgent[]) => void
  setOfficeLayout: (items: LayoutItem[]) => void
  setSoulPrompt: (prompt: string) => void
  appendReasoning: (text: string) => void
  clearReasoning: () => void
  clearMessages: () => void
  switchProfile: (id: string) => void
  createProfile: (name: string) => void
  deleteProfile: (id: string) => void
  renameProfile: (id: string, name: string) => void
  addScheduledTask: (task: ScheduleTask) => void
  updateScheduledTask: (id: string, patch: Partial<ScheduleTask>) => void
  deleteScheduledTask: (id: string) => void
  tickScheduledTask: (id: string) => void
  createWorkflow: (name: string) => string
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  setActiveWorkflow: (id: string | null) => void
  updateWorkflowNodes: (id: string, nodes: WorkflowNode[]) => void
  updateWorkflowEdges: (id: string, edges: WorkflowEdge[]) => void
  startWorkflowExecution: (workflowId: string) => void
  updateNodeExecution: (nodeId: string, status: NodeExecutionStatus, output?: string) => void
  completeWorkflowExecution: (status: 'completed' | 'failed') => void
  setTheme: (theme: ThemeMode) => void
  setAiConfigMode: (mode: boolean) => void
  addProjectRoom: (name: string) => void
  removeProjectRoom: (id: string) => void
  addTeamMember: (roomId: string, role: TeamRole, name: string) => void
  removeTeamMember: (roomId: string, memberId: string) => void
  updateMemberActivity: (roomId: string, memberId: string, activity: TeamMember['activity']) => void
  submitApproval: (request: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>) => void
  respondApproval: (id: string, approved: boolean) => void
  submitChatApproval: (req: Omit<ChatApprovalRequest, 'id' | 'status' | 'createdAt'>) => void
  respondChatApproval: (approved: boolean) => void
  notify: (title: string, body: string) => void
}

function getCombinedState(): AppState {
  const theme = useThemeStore.getState()
  const chat = useChatStore.getState()
  const profile = useProfileStore.getState()
  const schedule = useScheduleStore.getState()
  const workflow = useWorkflowStore.getState()
  const office = useOfficeStore.getState()

  return {
    theme: theme.theme,
    view: chat.view,
    messages: chat.messages,
    isLoading: chat.isLoading,
    toolProgress: chat.toolProgress,
    sessionId: chat.sessionId,
    canvasAgents: profile.canvasAgents,
    reasoningContent: chat.reasoningContent,
    officeLayout: profile.officeLayout,
    soulPrompt: profile.soulPrompt,
    profiles: profile.profiles,
    activeProfileId: profile.activeProfileId,
    scheduledTasks: schedule.scheduledTasks,
    workflows: workflow.workflows,
    activeWorkflowId: workflow.activeWorkflowId,
    workflowExecution: workflow.workflowExecution,
    isAiConfigMode: chat.isAiConfigMode,
    projectRooms: office.projectRooms,
    approvalRequests: office.approvalRequests,
    chatApproval: chat.chatApproval,

    setView: chat.setView,
    addMessage: chat.addMessage,
    appendToLastAgent: chat.appendToLastAgent,
    setLoading: chat.setLoading,
    setToolProgress: chat.setToolProgress,
    setSessionId: chat.setSessionId,
    setCanvasAgents: profile.setCanvasAgents,
    setOfficeLayout: profile.setOfficeLayout,
    setSoulPrompt: profile.setSoulPrompt,
    appendReasoning: chat.appendReasoning,
    clearReasoning: chat.clearReasoning,
    clearMessages: chat.clearMessages,
    switchProfile: profile.switchProfile,
    createProfile: profile.createProfile,
    deleteProfile: profile.deleteProfile,
    renameProfile: profile.renameProfile,
    addScheduledTask: schedule.addScheduledTask,
    updateScheduledTask: schedule.updateScheduledTask,
    deleteScheduledTask: schedule.deleteScheduledTask,
    tickScheduledTask: schedule.tickScheduledTask,
    createWorkflow: workflow.createWorkflow,
    updateWorkflow: workflow.updateWorkflow,
    deleteWorkflow: workflow.deleteWorkflow,
    setActiveWorkflow: workflow.setActiveWorkflow,
    updateWorkflowNodes: workflow.updateWorkflowNodes,
    updateWorkflowEdges: workflow.updateWorkflowEdges,
    startWorkflowExecution: workflow.startWorkflowExecution,
    updateNodeExecution: workflow.updateNodeExecution,
    completeWorkflowExecution: workflow.completeWorkflowExecution,
    setTheme: theme.setTheme,
    setAiConfigMode: chat.setAiConfigMode,
    addProjectRoom: office.addProjectRoom,
    removeProjectRoom: office.removeProjectRoom,
    addTeamMember: office.addTeamMember,
    removeTeamMember: office.removeTeamMember,
    updateMemberActivity: office.updateMemberActivity,
    submitApproval: office.submitApproval,
    respondApproval: office.respondApproval,
    submitChatApproval: chat.submitChatApproval,
    respondChatApproval: chat.respondChatApproval,
    notify: office.notify
  }
}

function routeSetState(patch: Partial<AppState>): void {
  if (patch.scheduledTasks !== undefined) {
    useScheduleStore.setState({ scheduledTasks: patch.scheduledTasks })
  }
  if (patch.workflows !== undefined) {
    useWorkflowStore.setState({ workflows: patch.workflows })
  }
  if (patch.chatApproval !== undefined) {
    useChatStore.setState({ chatApproval: patch.chatApproval })
  }
  if (patch.messages !== undefined) {
    useChatStore.setState({ messages: patch.messages })
  }
}

export interface UseAppStore {
  <T = AppState>(selector?: (state: AppState) => T): T
  getState: () => AppState
  setState: (partial: Partial<AppState>) => void
}

export const useAppStore: UseAppStore = function useAppStore<T = AppState>(
  selector?: (state: AppState) => T
): T {
  const theme = useThemeStore((s) => s.theme)
  const chatView = useChatStore((s) => s.view)
  const chatMessages = useChatStore((s) => s.messages)
  const chatLoading = useChatStore((s) => s.isLoading)
  const chatToolProgress = useChatStore((s) => s.toolProgress)
  const chatSessionId = useChatStore((s) => s.sessionId)
  const chatReasoning = useChatStore((s) => s.reasoningContent)
  const chatAiConfigMode = useChatStore((s) => s.isAiConfigMode)
  const chatApproval = useChatStore((s) => s.chatApproval)
  const profileCanvasAgents = useProfileStore((s) => s.canvasAgents)
  const profileOfficeLayout = useProfileStore((s) => s.officeLayout)
  const profileSoulPrompt = useProfileStore((s) => s.soulPrompt)
  const profileProfiles = useProfileStore((s) => s.profiles)
  const profileActiveId = useProfileStore((s) => s.activeProfileId)
  const scheduleTasks = useScheduleStore((s) => s.scheduledTasks)
  const wfWorkflows = useWorkflowStore((s) => s.workflows)
  const wfActiveId = useWorkflowStore((s) => s.activeWorkflowId)
  const wfExecution = useWorkflowStore((s) => s.workflowExecution)
  const officeRooms = useOfficeStore((s) => s.projectRooms)
  const officeApprovals = useOfficeStore((s) => s.approvalRequests)

  const state: AppState = {
    theme,
    view: chatView,
    messages: chatMessages,
    isLoading: chatLoading,
    toolProgress: chatToolProgress,
    sessionId: chatSessionId,
    canvasAgents: profileCanvasAgents,
    reasoningContent: chatReasoning,
    officeLayout: profileOfficeLayout,
    soulPrompt: profileSoulPrompt,
    profiles: profileProfiles,
    activeProfileId: profileActiveId,
    scheduledTasks: scheduleTasks,
    workflows: wfWorkflows,
    activeWorkflowId: wfActiveId,
    workflowExecution: wfExecution,
    isAiConfigMode: chatAiConfigMode,
    projectRooms: officeRooms,
    approvalRequests: officeApprovals,
    chatApproval: chatApproval,

    setView: useChatStore.getState().setView,
    addMessage: useChatStore.getState().addMessage,
    appendToLastAgent: useChatStore.getState().appendToLastAgent,
    setLoading: useChatStore.getState().setLoading,
    setToolProgress: useChatStore.getState().setToolProgress,
    setSessionId: useChatStore.getState().setSessionId,
    setCanvasAgents: useProfileStore.getState().setCanvasAgents,
    setOfficeLayout: useProfileStore.getState().setOfficeLayout,
    setSoulPrompt: useProfileStore.getState().setSoulPrompt,
    appendReasoning: useChatStore.getState().appendReasoning,
    clearReasoning: useChatStore.getState().clearReasoning,
    clearMessages: useChatStore.getState().clearMessages,
    switchProfile: useProfileStore.getState().switchProfile,
    createProfile: useProfileStore.getState().createProfile,
    deleteProfile: useProfileStore.getState().deleteProfile,
    renameProfile: useProfileStore.getState().renameProfile,
    addScheduledTask: useScheduleStore.getState().addScheduledTask,
    updateScheduledTask: useScheduleStore.getState().updateScheduledTask,
    deleteScheduledTask: useScheduleStore.getState().deleteScheduledTask,
    tickScheduledTask: useScheduleStore.getState().tickScheduledTask,
    createWorkflow: useWorkflowStore.getState().createWorkflow,
    updateWorkflow: useWorkflowStore.getState().updateWorkflow,
    deleteWorkflow: useWorkflowStore.getState().deleteWorkflow,
    setActiveWorkflow: useWorkflowStore.getState().setActiveWorkflow,
    updateWorkflowNodes: useWorkflowStore.getState().updateWorkflowNodes,
    updateWorkflowEdges: useWorkflowStore.getState().updateWorkflowEdges,
    startWorkflowExecution: useWorkflowStore.getState().startWorkflowExecution,
    updateNodeExecution: useWorkflowStore.getState().updateNodeExecution,
    completeWorkflowExecution: useWorkflowStore.getState().completeWorkflowExecution,
    setTheme: useThemeStore.getState().setTheme,
    setAiConfigMode: useChatStore.getState().setAiConfigMode,
    addProjectRoom: useOfficeStore.getState().addProjectRoom,
    removeProjectRoom: useOfficeStore.getState().removeProjectRoom,
    addTeamMember: useOfficeStore.getState().addTeamMember,
    removeTeamMember: useOfficeStore.getState().removeTeamMember,
    updateMemberActivity: useOfficeStore.getState().updateMemberActivity,
    submitApproval: useOfficeStore.getState().submitApproval,
    respondApproval: useOfficeStore.getState().respondApproval,
    submitChatApproval: useChatStore.getState().submitChatApproval,
    respondChatApproval: useChatStore.getState().respondChatApproval,
    notify: useOfficeStore.getState().notify
  }

  if (selector) {
    return selector(state)
  }
  return state as T
} as UseAppStore

useAppStore.getState = getCombinedState
useAppStore.setState = routeSetState
