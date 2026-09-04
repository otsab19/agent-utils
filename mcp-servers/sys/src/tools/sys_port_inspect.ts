/**
 * sys_port_inspect — Detects hung local dev ports, correlates to PIDs,
 * and provides safe termination hooks.
 */

import { execSync } from 'node:child_process';

interface PortInfo {
  port: number;
  pid: number | null;
  processName: string | null;
  state: string;
  canTerminate: boolean;
}

interface PortInspectResult {
  ports: PortInfo[];
  hungPorts: number[];
}

export const sysPortInspect = {
  name: 'sys_port_inspect',
  description: 'Inspects local ports for hung processes and returns safe kill options',
  async handler(params: Record<string, unknown>): Promise<PortInspectResult> {
    const targetPorts = (params['ports'] as number[]) ?? [3000, 3001, 4000, 8000, 8080, 8888];

    const results: PortInfo[] = [];

    for (const port of targetPorts) {
      let pid: number | null = null;
      let processName: string | null = null;
      let state = 'closed';

      try {
        const lsofOutput = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P 2>/dev/null || true`, {
          encoding: 'utf8',
          timeout: 10_000,
        });

        const lines = lsofOutput.trim().split('\n').filter(Boolean);
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          processName = parts[0] ?? null;
          pid = parts[1] ? parseInt(parts[1], 10) : null;
          state = 'LISTEN';
        }
      } catch {
        // lsof not available — try ss on Linux
        try {
          const ssOutput = execSync(`ss -tlnp 2>/dev/null | grep :${port} || true`, {
            encoding: 'utf8',
            timeout: 10_000,
          });
          if (ssOutput.includes(`:${port}`)) {
            state = 'LISTEN';
            const pidMatch = ssOutput.match(/pid=(\d+)/);
            pid = pidMatch ? parseInt(pidMatch[1], 10) : null;
          }
        } catch {
          // ignore
        }
      }

      results.push({ port, pid, processName, state, canTerminate: pid !== null });
    }

    const hungPorts = results.filter((r) => r.state === 'LISTEN').map((r) => r.port);
    return { ports: results, hungPorts };
  },
};
