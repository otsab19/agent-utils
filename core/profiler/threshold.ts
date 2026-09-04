/**
 * Cost-Aware Profiler — Threshold Gate & Engineer Override
 *
 * Blocks code application if resource complexity exceeds thresholds.
 * Requires explicit engineer override to proceed.
 */

import type { BillingProjection } from './billing.js';
import type { ScanResult } from './scanner.js';

export interface GateDecision {
  blocked: boolean;
  reason: string;
  overrideToken?: string;
}

/** Simple override token store (production: use a signed JWT or session key) */
const activeOverrides = new Set<string>();

/**
 * Generates a one-time override token for engineer acknowledgment.
 */
export function generateOverrideToken(): string {
  const token = `override-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  activeOverrides.add(token);
  return token;
}

/**
 * Consumes an override token (single use).
 */
export function consumeOverrideToken(token: string): boolean {
  if (activeOverrides.has(token)) {
    activeOverrides.delete(token);
    return true;
  }
  return false;
}

/**
 * Evaluates scan + billing results and decides whether to block.
 *
 * @param scan - AST scan result
 * @param billing - Billing projection result
 * @param overrideToken - Optional engineer-provided override token
 */
export function evaluateGate(
  scan: ScanResult,
  billing: BillingProjection,
  overrideToken?: string
): GateDecision {
  if (overrideToken && consumeOverrideToken(overrideToken)) {
    return { blocked: false, reason: 'Engineer override accepted.', overrideToken };
  }

  const errorCount = scan.antiPatterns.filter((p) => p.severity === 'error').length;

  if (errorCount > 0 || billing.exceedsThreshold) {
    const reasons: string[] = [];
    if (errorCount > 0) {
      reasons.push(`${errorCount} critical anti-pattern(s) detected`);
    }
    if (billing.exceedsThreshold) {
      reasons.push(
        `Estimated monthly cost $${billing.totalEstimatedMonthlyCostUSD.toFixed(2)} exceeds threshold $${billing.thresholdUSD}`
      );
    }

    return {
      blocked: true,
      reason: `CODE APPLICATION BLOCKED: ${reasons.join('; ')}. Generate an override token to proceed.`,
    };
  }

  return { blocked: false, reason: 'All cost checks passed.' };
}
