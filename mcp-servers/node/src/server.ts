#!/usr/bin/env node
/**
 * agent-mcp-node — Node.js/TypeScript MCP Server
 *
 * Exposes JS/TS-specific tooling over JSON-RPC 2.0 via stdio.
 * Tools: ts_typecheck_stream, js_bundle_inspect, node_runtime_eval
 */

import { createInterface } from 'node:readline';
import type { McpRequest, McpResponse, McpTool } from './types.js';
import { tsTypecheckStream } from './tools/ts_typecheck_stream.js';
import { jsBundleInspect } from './tools/js_bundle_inspect.js';
import { nodeRuntimeEval } from './tools/node_runtime_eval.js';

const toolRegistry = new Map<string, McpTool>([
  ['ts_typecheck_stream', tsTypecheckStream],
  ['js_bundle_inspect', jsBundleInspect],
  ['node_runtime_eval', nodeRuntimeEval],
]);

function respond(id: string | number | null, result?: unknown, error?: { code: number; message: string }): void {
  const response: McpResponse = { jsonrpc: '2.0', id: id ?? null };
  if (error) response.error = error;
  else response.result = result;
  process.stdout.write(JSON.stringify(response) + '\n');
}

async function handleRequest(raw: string): Promise<void> {
  let req: McpRequest;
  try {
    req = JSON.parse(raw) as McpRequest;
  } catch (e) {
    respond(null, undefined, { code: -32700, message: `Parse error: ${String(e)}` });
    return;
  }

  const tool = toolRegistry.get(req.method);
  if (!tool) {
    respond(req.id, undefined, { code: -32601, message: `Method not found: ${req.method}` });
    return;
  }

  try {
    const result = await tool.handler(req.params ?? {});
    respond(req.id, result);
  } catch (e) {
    respond(req.id, undefined, { code: -32000, message: String(e) });
  }
}

process.stderr.write('[agent-mcp-node] started (transport: stdio)\n');

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed) void handleRequest(trimmed);
});
