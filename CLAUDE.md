# AI GUI — Claude Code 项目指令

## 项目概览

AI Agent 可视化桌面工作台。Electron + React + TypeScript + Zustand + SQLite。
支持 Multi-Agent 聊天（4 Provider）、2.5D 等轴测办公室可视化、DAG 工作流编排。

## 技术栈版本

- Electron 39, electron-vite 5, React 19, TypeScript 5.9
- Zustand 5, @xyflow/react 12, Tailwind CSS 4, better-sqlite3
- Vitest 3 (单元), Playwright 1.60 (E2E), ESLint 10

## 开发命令

```bash
npm run dev              # 开发模式
npm run build            # 类型检查 + 构建
npm run typecheck        # 全量 tsc
npm run typecheck:node   # 主进程 tsc
npm run typecheck:web    # 渲染进程 tsc
npm run lint             # ESLint
npm test                 # Vitest 单元测试
npm run test:watch       # Vitest 监听模式
npm run test:e2e         # Playwright E2E
```

## 架构概览

三层 Electron 架构：

1. **main/** — 主进程：BrowserWindow、IPC handlers、SSE 聊天、SQLite 持久化
2. **preload/** — 桥接层：`contextBridge.exposeInMainWorld('aiGui', api)`
3. **renderer/** — 渲染进程：React 19 UI，通过 `window.aiGui.*` 调用主进程

通信：renderer → `window.aiGui.xxx()` → ipcRenderer.invoke → ipcMain.handle → main 进程

## 关键目录

| 目录 | 职责 |
|------|------|
| `src/main/` | Electron 主进程（chat, sessions, persistence, config, auth） |
| `src/preload/` | contextBridge API 定义 |
| `src/renderer/src/components/` | React UI 组件 |
| `src/renderer/src/components/three/` | 2.5D 等轴测办公室（SVG） |
| `src/renderer/src/components/canvas/` | Agent 画布（ReactFlow） |
| `src/renderer/src/components/workflow/` | DAG 工作流编辑器 |
| `src/renderer/src/stores/` | Zustand 状态（6 子 store + app.ts 聚合） |
| `src/renderer/src/hooks/` | useChatStream、usePersistence、useConfirm |
| `src/renderer/src/lib/` | 工具函数（genId, export, approvalDetection, contextManager） |
| `src/shared/types/` | 跨进程共享类型 |
| `src/shared/i18n/` | 中英文翻译 |

## Agent 团队

项目有 6 个专属 Agent，位于 `.claude/agents/`：

| Agent | 职责 | 触发场景 |
|-------|------|----------|
| `aigui-electron` | Electron 主进程 | 修改 `main/` 或 `preload/` |
| `aigui-ui` | React 渲染进程 UI | 修改 `components/`、`hooks/`、`styles/` |
| `aigui-iso` | 2.5D 等轴测可视化 | 修改 `components/three/` |
| `aigui-workflow` | 工作流引擎 | 修改 `workflow/` 或 `lib/workflowEngine.ts` |
| `aigui-chat` | 聊天系统 | 修改 `chat.ts`、`useChatStream`、`ChatPanel` |
| `aigui-store` | 状态管理 | 修改 `stores/` 或 `usePersistence.ts` |

## 编码规则

### 必须遵守

- **Store 消费** — 必须用精确 selector：`useAppStore((s) => s.field)`，禁止无 selector 调用
- **IPC 安全** — 所有 `ipcMain.handle` 必须验证参数类型
- **新增 IPC** — 必须三处同步：preload API + main handler + shared/types
- **主题** — 使用 CSS 变量 `var(--t-xxx)`，不硬编码颜色
- **i18n** — 使用 `useTranslation()` hook，不硬编码 UI 文本
- **确认对话框** — 使用 `useConfirm` hook，不使用原生 `confirm()`
- **不可变更新** — 用 spread 运算符，不直接修改 state 对象
- **组件大小** — 单文件 <400 行，超出则拆分子组件或 hooks
- **IPC 调用** — 必须检查 `window.aiGui` 存在后再调用

### 禁止

- 禁止无 selector 的 `useAppStore()` 调用
- 禁止使用 `any`（用 `unknown` + 类型窄化）
- 禁止 `console.log` 残留在生产代码中
- 禁止 `setTimeout(fn, 0)` hack（ReactFlow 同步用 `applyNodeChanges`）
- 禁止硬编码颜色值（用 CSS 变量）

## 测试要求

- **框架**：Vitest 3，globals 模式，node 环境
- **覆盖率门槛**：lines 80%、functions 80%、branches 70%、statements 80%
- **测试范围**：覆盖 `vitest.config.ts` 中 `coverage.include` 列出的文件
- **测试文件位置**：`src/**/__tests__/*.test.ts(x)` 或 `src/**/*.test.ts(x)`
- **纯函数优先**：IsoEngine、themeColors、approvalDetection、stores 等纯逻辑必须有单元测试
- **E2E**：Playwright，`npm run test:e2e`
