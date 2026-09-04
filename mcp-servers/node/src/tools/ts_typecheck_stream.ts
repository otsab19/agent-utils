/**
 * ts_typecheck_stream — Runs tsc --noEmit --incremental and translates
 * diagnostic codes into human-readable path-to-type maps.
 */

import { execSync } from 'node:child_process';
import type { McpTool } from '../types.js';

interface TsDiagnostic {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

const TS_CODE_DESCRIPTIONS: Record<string, string> = {
  TS2322: 'Type is not assignable to target type',
  TS2345: 'Argument type not assignable to parameter type',
  TS2339: 'Property does not exist on type',
  TS2304: 'Cannot find name',
  TS7006: 'Parameter implicitly has any type',
  TS2307: 'Cannot find module or its type declarations',
};

function parseTscOutput(output: string): TsDiagnostic[] {
  const lines = output.split('\n');
  const diagnostics: TsDiagnostic[] = [];
  const pattern = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const [, file, lineNum, col, severity, code, message] = match;
      diagnostics.push({
        file,
        line: parseInt(lineNum, 10),
        column: parseInt(col, 10),
        code,
        message: `${TS_CODE_DESCRIPTIONS[code] ?? message}: ${message}`,
        severity: severity as 'error' | 'warning',
      });
    }
  }
  return diagnostics;
}

export const tsTypecheckStream: McpTool = {
  name: 'ts_typecheck_stream',
  description: 'Runs tsc --noEmit and returns structured diagnostic objects',
  async handler(params) {
    const repoPath = (params['repoPath'] as string) ?? process.cwd();

    let output = '';
    try {
      execSync('npx tsc --noEmit --incremental', {
        cwd: repoPath,
        timeout: 120_000,
        encoding: 'utf8',
      });
    } catch (e: unknown) {
      output = (e as { stdout?: string; stderr?: string }).stdout ?? '';
    }

    const diagnostics = parseTscOutput(output);
    return {
      repoPath,
      errorCount: diagnostics.filter((d) => d.severity === 'error').length,
      warningCount: diagnostics.filter((d) => d.severity === 'warning').length,
      diagnostics,
    };
  },
};
