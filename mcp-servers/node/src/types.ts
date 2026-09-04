export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface McpTool {
  name: string;
  description: string;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}
