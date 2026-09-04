/**
 * sys_path_verify — Validates binary existence across $PATH before
 * allowing agents to invoke tooling.
 */

import { execSync } from 'node:child_process';
import * as path from 'node:path';

interface BinaryStatus {
  binary: string;
  found: boolean;
  resolvedPath: string | null;
  version: string | null;
}

export const sysPathVerify = {
  name: 'sys_path_verify',
  description: 'Validates binary presence in $PATH and returns resolved paths and versions',
  async handler(params: Record<string, unknown>): Promise<{ binaries: BinaryStatus[] }> {
    const binaries = (params['binaries'] as string[]) ?? [
      'node', 'npm', 'npx', 'go', 'python3', 'pip', 'dotnet', 'java', 'docker', 'git',
    ];

    const statuses: BinaryStatus[] = await Promise.all(
      binaries.map(async (bin): Promise<BinaryStatus> => {
        let found = false;
        let resolvedPath: string | null = null;
        let version: string | null = null;

        try {
          resolvedPath = execSync(`which ${bin} 2>/dev/null`, {
            encoding: 'utf8',
            timeout: 5_000,
          }).trim();
          found = resolvedPath.length > 0;
        } catch {
          found = false;
        }

        if (found) {
          try {
            version = execSync(`${bin} --version 2>&1 | head -1`, {
              encoding: 'utf8',
              timeout: 5_000,
            }).trim();
          } catch {
            version = null;
          }
        }

        return { binary: bin, found, resolvedPath, version };
      })
    );

    return { binaries: statuses };
  },
};
