/**
 * Shared types across all AgentUtils core skill engines.
 */

export interface SkillContext {
  /** Absolute path to the repository root */
  repoRoot: string;
  /** Current git branch */
  branch: string;
  /** Files modified in the current task */
  touchedFiles: string[];
}

export interface SkillResult {
  skill: string;
  triggered: boolean;
  action: string;
  payload?: Record<string, unknown>;
  directive?: string;
}

export type TransportType = 'stdio' | 'sse';

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}
