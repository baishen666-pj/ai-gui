# AI GUI v0.2.0

AI Agent 可视化桌面工作台 — 支持 Multi-Agent 协同、DAG 工作流编排、2.5D 等轴测办公室可视化、MCP 协议双向对接。

## 技术栈

- **Electron 39** + **electron-vite 5** — 桌面应用框架
- **React 19** + **TypeScript 5.9** — 渲染进程 UI
- **Zustand 5** — 状态管理（8 子 store + 聚合 facade）
- **@xyflow/react 12** — Agent 画布和工作流编辑器
- **@modelcontextprotocol/sdk** — MCP 协议双向支持（Server + Client）
- **Tailwind CSS 4** — 样式系统，三主题（dark / light / cyberpunk）
- **better-sqlite3** — 本地 SQLite 持久化（FTS5 全文搜索）
- **Vitest** + **Playwright** — 单元测试 + E2E 测试

## 功能特性

- **Multi-Agent 聊天** — SSE 流式传输，支持智谱 / OpenAI / Claude / Ollama 四个 Provider
- **2.5D 等轴测办公室** — SVG 渲染，Q版角色动画，三主题色板，可自定义家具布局
- **Agent 画布** — ReactFlow 节点拖拽，配置 Agent 角色、工具和系统提示词
- **DAG 工作流引擎** — 可视化编排 start/agent/condition/end 节点，上下文传递，循环检测
- **记忆系统** — MEMORY.md 跨会话记忆、USER.md 用户画像、SOUL.md AI 角色定义，MemoryPanel + SoulEditorPanel 可视化管理
- **AGENTS.md 分层 Override** — 根目录到工作目录逐层扫描 AGENTS.md，支持 AGENTS.override.md 替换父级指令
- **Checkpoint Rewind** — AI 修改文件前自动快照，支持列出 / 恢复 / 删除历史 checkpoint
- **三级沙箱** — read-only（默认）/ workspace-write / full-access 三级权限，路径遍历防护 + 命令黑名单
- **MCP 双向支持** — 内置 MCP Server（8 个工具：agent, session, workflow, workspace）+ MCP Client 连接外部服务器
- **工具注册表** — ToolSpec + ToolHandler 类型分离，5 个内置工具（file-ops, shell, search），支持动态注册
- **审批流** — 危险内容自动检测，人工审批拦截
- **定时任务** — CRON 表达式调度，倒计时显示
- **SOUL 编辑器** — 可视化编辑 Agent 系统提示词
- **会话管理** — SQLite 持久化，全文搜索，导入导出
- **i18n** — 中英文双语支持
- **快捷键** — Ctrl+1~9 切换视图，Ctrl+N 新建对话，Ctrl+/ 快捷键帮助

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 类型检查 + 构建
npm run build

# 运行测试
npm test

# 测试覆盖率
npx vitest run --coverage
```

## 项目结构

```
ai-gui/
├── src/
│   ├── main/            # Electron 主进程
│   │   ├── index.ts     # BrowserWindow、菜单、IPC 注册
│   │   ├── chat.ts      # SSE 流式聊天（4 Provider）
│   │   ├── sessions.ts  # SQLite 会话 CRUD（FTS5）
│   │   ├── persistence.ts # 定时任务/工作流持久化
│   │   ├── config.ts    # Provider 连接配置
│   │   ├── auth.ts      # OAuth 登录
│   │   ├── locale.ts    # 国际化
│   │   ├── memory.ts    # 记忆系统（MEMORY/USER/SOUL 三文件）
│   │   ├── agents-config.ts # AGENTS.md 分层扫描与 override
│   │   ├── checkpoint.ts # Checkpoint 快照与回退
│   │   ├── sandbox.ts   # 三级沙箱权限控制
│   │   ├── mcp/         # MCP 双向支持
│   │   │   ├── index.ts   # MCP 入口（Server + Client 初始化）
│   │   │   ├── server.ts  # MCP Server（8 个内置工具）
│   │   │   ├── client.ts  # MCP Client（连接外部服务器）
│   │   │   └── tools/     # MCP Server 工具实现
│   │   │       ├── agent-chat.ts
│   │   │       ├── agent-tools.ts
│   │   │       ├── session-tools.ts
│   │   │       ├── workflow-tools.ts
│   │   │       └── workspace-tools.ts
│   │   └── tools/       # 工具注册表
│   │       ├── index.ts   # 内置工具注册入口
│   │       ├── types.ts   # ToolSpec + ToolHandler 类型
│   │       ├── registry.ts # 动态注册 / 注销 API
│   │       ├── file-ops.ts # 文件读写工具
│   │       ├── shell.ts    # Shell 命令工具
│   │       └── search.ts   # 文件搜索工具
│   ├── preload/         # Preload 脚本
│   │   └── index.ts     # contextBridge → window.aiGui
│   ├── renderer/        # React 渲染进程
│   │   └── src/
│   │       ├── App.tsx  # 入口：视图路由、快捷键、懒加载
│   │       ├── components/   # UI 组件
│   │       │   ├── canvas/   # Agent 画布（ReactFlow）
│   │       │   ├── three/    # 2.5D 等轴测办公室
│   │       │   ├── workflow/ # DAG 工作流编辑器
│   │       │   ├── MemoryPanel.tsx      # 记忆系统面板
│   │       │   ├── SoulEditorPanel.tsx  # SOUL 编辑器面板
│   │       │   ├── CheckpointPanel.tsx  # Checkpoint 管理面板
│   │       │   ├── SettingsPanel.tsx    # 设置面板（含沙箱配置）
│   │       │   ├── ToolsPanel.tsx       # 工具注册表面板
│   │       │   └── ...       # ChatPanel、Sidebar 等
│   │       ├── stores/       # Zustand 状态（8 子 store）
│   │       ├── hooks/        # 自定义 hooks
│   │       ├── lib/          # 工具函数
│   │       └── styles/       # Tailwind + 三主题 CSS
│   └── shared/         # 主进程与渲染进程共享
│       ├── types/       # TypeScript 类型定义
│       └── i18n/        # 中英文翻译
├── electron.vite.config.ts  # 构建配置
├── vitest.config.ts         # 测试配置
└── eslint.config.cjs        # ESLint 配置
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发模式（热重载） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run start` | 预览生产构建 |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:e2e` | Playwright E2E 测试 |
| `npm run typecheck` | 全量 TypeScript 类型检查 |
| `npm run typecheck:node` | 仅检查主进程类型 |
| `npm run typecheck:web` | 仅检查渲染进程类型 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm run build:win` | 构建 Windows 安装包 |
| `npm run build:mac` | 构建 macOS 安装包 |
| `npm run build:linux` | 构建 Linux 安装包 |

## License

ISC
