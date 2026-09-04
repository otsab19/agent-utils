/**
 * Rabbit Hole Reverser — Engine
 *
 * Trigger: ≥3 consecutive test failures with identical error signatures or cyclic edits.
 * Mechanism:
 *  1. Captures `git diff` against the base task branch.
 *  2. Issues `git reset --hard HEAD~1` or resets dirty workspace state.
 *  3. Injects a system interrupt directive.
 */

import { execSync } from 'node:child_process';
import type { SkillContext, SkillResult } from '../types.js';
import { buildInterruptDirective } from './interrupt.js';

const FAILURE_THRESHOLD = 3;

interface FailureRecord {
  errorSignature: string;
  count: number;
  lastSeenAt: Date;
}

/** In-memory failure ring buffer keyed by repo root */
const failureRegistry = new Map<string, FailureRecord>();

/**
 * Computes a stable hash from an error string by normalizing whitespace
 * and stripping line numbers that differ across runs.
 */
function normalizeErrorSignature(rawError: string): string {
  return rawError
    .replace(/line \d+/gi, 'line N')
    .replace(/:\d+:\d+/g, ':N:N')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 256); // cap length for stable key
}

/**
 * Records a test failure and evaluates whether the reversal threshold is met.
 *
 * @param context - Current skill context
 * @param rawError - Raw error output from the failing test run
 * @returns SkillResult indicating whether reversal was triggered
 */
export async function recordFailure(
  context: SkillContext,
  rawError: string
): Promise<SkillResult> {
  const signature = normalizeErrorSignature(rawError);
  const existing = failureRegistry.get(context.repoRoot);

  if (existing && existing.errorSignature === signature) {
    existing.count += 1;
    existing.lastSeenAt = new Date();
  } else {
    failureRegistry.set(context.repoRoot, {
      errorSignature: signature,
      count: 1,
      lastSeenAt: new Date(),
    });
  }

  const record = failureRegistry.get(context.repoRoot)!;

  if (record.count >= FAILURE_THRESHOLD) {
    return triggerReversal(context, record);
  }

  return {
    skill: 'rabbit-hole-reverser',
    triggered: false,
    action: `Failure recorded (${record.count}/${FAILURE_THRESHOLD})`,
    payload: { count: record.count, signature: record.errorSignature },
  };
}

/**
 * Executes the reversal: captures diff, resets workspace, injects directive.
 */
async function triggerReversal(
  context: SkillContext,
  record: FailureRecord
): Promise<SkillResult> {
  let diff = '';
  try {
    diff = execSync('git diff HEAD~1', {
      cwd: context.repoRoot,
      timeout: 15_000,
      encoding: 'utf8',
    });
  } catch {
    diff = '[Could not capture git diff — workspace may be in detached HEAD state]';
  }

  try {
    execSync('git reset --hard HEAD~1', {
      cwd: context.repoRoot,
      timeout: 15_000,
      encoding: 'utf8',
    });
  } catch (e) {
    console.error('[ReverserEngine] git reset failed:', e);
  }

  // Clear failure record after reset
  failureRegistry.delete(context.repoRoot);

  const directive = buildInterruptDirective(record.count, record.errorSignature);

  return {
    skill: 'rabbit-hole-reverser',
    triggered: true,
    action: 'git-reset-and-strategy-invalidation',
    payload: { diff, failureCount: record.count, signature: record.errorSignature },
    directive,
  };
}

/** Resets the failure counter for a given repo (e.g., after engineer override). */
export function resetCounter(repoRoot: string): void {
  failureRegistry.delete(repoRoot);
}
