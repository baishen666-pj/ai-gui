/**
 * Tool registration entry point.
 * Imports all tool modules and registers them with the central registry.
 */

import { registerTool } from './registry'
import { readFileSpec, readFileHandler, writeFileSpec, writeFileHandler } from './file-ops'
import { shellSpec, shellHandler } from './shell'
import { searchSpec, searchHandler } from './search'

/** Register all built-in tools. Idempotent — safe to call multiple times. */
export function registerBuiltinTools(): void {
  registerTool(readFileSpec, readFileHandler)
  registerTool(writeFileSpec, writeFileHandler)
  registerTool(shellSpec, shellHandler)
  registerTool(searchSpec, searchHandler)
}

// Re-export for convenience
export { registerTool, unregisterTool, getTool, listToolSpecs, listToolSpecsByLevel, executeTool, clearTools, type RegisteredTool } from './registry'
export type { ToolSpec, ToolHandler, ToolContext, ToolResult, SandboxLevel } from './types'
