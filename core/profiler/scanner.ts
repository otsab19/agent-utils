/**
 * Cost-Aware Profiler — AST Scanner
 *
 * Scans TypeScript/JavaScript source files for common cost anti-patterns:
 *  - N+1 query cascades (DB calls inside loops)
 *  - Unbounded in-memory array filtering
 *  - Unmemoized client hooks (React/Vue)
 *  - Missing await on async functions in loops
 */

import * as fs from 'node:fs/promises';

export interface AntiPattern {
  type:
    | 'n-plus-one-query'
    | 'unbounded-filter'
    | 'unmemoized-hook'
    | 'missing-await-in-loop'
    | 'unindexed-query';
  severity: 'error' | 'warning';
  lineNumber: number;
  snippet: string;
  description: string;
}

export interface ScanResult {
  filePath: string;
  antiPatterns: AntiPattern[];
  totalIssues: number;
}

/** Simple regex-based scanner (production: replace with proper AST parser via ts-morph) */
const PATTERN_RULES: Array<{
  type: AntiPattern['type'];
  severity: AntiPattern['severity'];
  pattern: RegExp;
  description: string;
}> = [
  {
    type: 'n-plus-one-query',
    severity: 'error',
    pattern: /for\s*\(.*\)\s*\{[^}]*(?:await\s+)?(?:db|prisma|supabase|knex|mongoose)\.\w+/gi,
    description: 'Database call inside a loop — potential N+1 query pattern. Use batch queries or DataLoader.',
  },
  {
    type: 'unbounded-filter',
    severity: 'warning',
    pattern: /\.filter\((?:[^)]{100,})\)/g,
    description: 'Potentially unbounded in-memory .filter() — consider server-side pagination.',
  },
  {
    type: 'unmemoized-hook',
    severity: 'warning',
    pattern: /const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{[^}]*(?:fetch|axios|http)/gi,
    description: 'Async function in component scope without useMemo/useCallback — runs on every render.',
  },
  {
    type: 'missing-await-in-loop',
    severity: 'error',
    pattern: /for\s*\(.*\)\s*\{[^}]*(?<!await\s)(?:fetch|axios\.get|axios\.post)\(/gi,
    description: 'Non-awaited async call inside loop — likely unintended fire-and-forget.',
  },
];

/**
 * Scans a source file for cost anti-patterns.
 *
 * @param filePath - Absolute path to the TypeScript/JavaScript file
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const antiPatterns: AntiPattern[] = [];

  for (const rule of PATTERN_RULES) {
    rule.pattern.lastIndex = 0; // reset global regex state
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(content)) !== null) {
      const lineNumber = content.slice(0, match.index).split('\n').length;
      antiPatterns.push({
        type: rule.type,
        severity: rule.severity,
        lineNumber,
        snippet: lines[lineNumber - 1]?.trim() ?? '',
        description: rule.description,
      });
    }
  }

  return { filePath, antiPatterns, totalIssues: antiPatterns.length };
}
