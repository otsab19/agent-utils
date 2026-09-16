#!/usr/bin/env node
/**
 * agent-mcp-sys — Bash & System Commands MCP Server
 *
 * Exposes safe shell execution tooling over JSON-RPC 2.0 via stdio.
 * Tools: sys_safe_exec, sys_port_inspect, sys_path_verify
 */

import { createInterface } from 'node:readline';
import { sysSafeExec } from './tools/sys_safe_exec.js';
import { sysPortInspect } from './tools/sys_port_inspect.js';
import { sysPathVerify } from './tools/sys_path_verify.js';
import { sysComplexityAnalyzer } from './tools/sys_complexity_analyzer.js';

interface McpTool {
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

const toolRegistry = new Map<string, McpTool>([
  ['sys_safe_exec', sysSafeExec],
  ['sys_port_inspect', sysPortInspect],
  ['sys_path_verify', sysPathVerify],
  ['sys_complexity_analyzer', sysComplexityAnalyzer],
]);

function respond(id: unknown, result?: unknown, error?: { code: number; message: string }): void {
  const response: Record<string, unknown> = { jsonrpc: '2.0', id: id ?? null };
  if (error) response['error'] = error;
  else response['result'] = result;
  process.stdout.write(JSON.stringify(response) + '\n');
}

async function handle(raw: string): Promise<void> {
  let req: { jsonrpc: string; id: unknown; method: string; params?: Record<string, unknown> };
  try {
    req = JSON.parse(raw);
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

process.stderr.write('[agent-mcp-sys] started (transport: stdio)\n');
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => { const t = line.trim(); if (t) void handle(t); });
