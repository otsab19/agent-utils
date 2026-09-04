/**
 * node_runtime_eval — Safely evaluates isolated JS/TS expressions in a node:vm sandbox.
 */

import * as vm from 'node:vm';
import type { McpTool } from '../types.js';

export const nodeRuntimeEval: McpTool = {
  name: 'node_runtime_eval',
  description: 'Evaluates JS expressions in an isolated vm sandbox',
  async handler(params) {
    const code = params['code'] as string;
    const timeoutMs = (params['timeoutMs'] as number) ?? 5000;

    if (!code) throw new Error('Required param: code');

    const sandbox = vm.createContext({
      console: { log: (...args: unknown[]) => logs.push(args.map(String).join(' ')) },
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
    });

    const logs: string[] = [];
    let result: unknown;
    let errorMessage: string | null = null;

    try {
      result = vm.runInContext(code, sandbox, { timeout: timeoutMs, filename: '<agent-eval>' });
    } catch (e) {
      errorMessage = String(e);
    }

    return {
      result: result !== undefined ? String(result) : null,
      logs,
      error: errorMessage,
      timedOut: errorMessage?.includes('Script execution timed out') ?? false,
    };
  },
};
