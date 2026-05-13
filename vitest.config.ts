import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/main/sse-parser.ts',
        'src/main/utils.ts',
        'src/renderer/src/components/three/IsoEngine.ts',
        'src/renderer/src/components/three/themeColors.ts',
        'src/renderer/src/lib/genId.ts',
        'src/renderer/src/lib/approvalDetection.ts',
        'src/renderer/src/lib/contextManager.ts',
        'src/renderer/src/lib/export.ts',
        'src/renderer/src/lib/agentConfigPrompt.ts',
        'src/renderer/src/stores/chatStore.ts',
        'src/renderer/src/stores/officeStore.ts',
        'src/renderer/src/stores/profileStore.ts',
        'src/renderer/src/stores/scheduleStore.ts',
        'src/renderer/src/stores/themeStore.ts',
        'src/renderer/src/stores/workflowStore.ts',
        'src/shared/i18n/en.ts',
        'src/shared/i18n/zh-CN.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared'),
    },
  },
})
