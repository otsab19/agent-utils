/**
 * sys_safe_exec — Executes bash/zsh commands with intercepts for:
 *  - Infinite processes (timeout enforcement)
 *  - Memory bloat
 *  - Terminal hang risks (dquote> prevention)
 *
 * BLOCKED commands: git push --force, rm -rf /, DROP TABLE, kubectl delete namespace
 */

import { execSync } from 'node:child_process';

interface SafeExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  blocked: boolean;
  blockReason?: string;
}

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /git\s+push\s+(--force|-f)\b/i, reason: 'Force push is blocked — risk of history loss' },
  { pattern: /rm\s+-rf\s+\//i, reason: 'Recursive delete from root is blocked' },
  { pattern: /DROP\s+(TABLE|DATABASE)\b/i, reason: 'Destructive DB command blocked — no backup verified' },
  { pattern: /kubectl\s+delete\s+namespace\b/i, reason: 'Namespace deletion requires dry-run confirmation first' },
  { pattern: /:\(\){.*}\s*;.*:/i, reason: 'Fork bomb pattern detected' },
];

export const sysSafeExec = {
  name: 'sys_safe_exec',
  description: 'Executes a shell command with safety intercepts and timeout enforcement',
  async handler(params: Record<string, unknown>): Promise<SafeExecResult> {
    const command = params['command'] as string;
    const timeoutMs = (params['timeoutMs'] as number) ?? 120_000;
    const cwd = (params['cwd'] as string) ?? process.cwd();

    if (!command) throw new Error('Required param: command');

    // Check against blocked patterns
    for (const { pattern, reason } of BLOCKED_PATTERNS) {
      if (pattern.test(command)) {
        return {
          stdout: '',
          stderr: reason,
          exitCode: 1,
          timedOut: false,
          blocked: true,
          blockReason: reason,
        };
      }
    }

    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let timedOut = false;

    try {
      const output = execSync(command, {
        cwd,
        timeout: timeoutMs,
        encoding: 'utf8',
        env: {
          ...process.env,
          DEBIAN_FRONTEND: 'noninteractive',
          GIT_TERMINAL_PROMPT: '0',
          NPM_CONFIG_FUND: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      stdout = output;
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; status?: number; code?: string };
      stdout = err.stdout ?? '';
      stderr = err.stderr ?? String(e);
      exitCode = err.status ?? 1;
      timedOut = err.code === 'ETIMEDOUT';
    }

    return { stdout, stderr, exitCode, timedOut, blocked: false };
  },
};
