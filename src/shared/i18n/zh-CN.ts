import type { LocaleMessages } from './types'

export const zhCN: LocaleMessages = {
  app: {
    title: 'AI GUI',
    subtitle: '多Agent桌面工作台'
  },
  sidebar: {
    chat: '聊天',
    canvas: 'Agent 画布',
    memory: '记忆',
    tools: '工具',
    settings: '设置'
  },
  chat: {
    placeholder: '输入消息，/ 查看命令...',
    send: '发送',
    newChat: '新对话',
    thinking: '思考中...'
  },
  settings: {
    title: '设置',
    language: '语言',
    connection: '连接配置',
    model: '模型配置',
    local: '本地模式',
    remote: '远程模式',
    save: '保存'
  },
  common: {
    loading: '加载中...',
    error: '出错了',
    retry: '重试',
    cancel: '取消'
  }
}
