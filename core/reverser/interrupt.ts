/**
 * Rabbit Hole Reverser — System Interrupt Directive Builder
 *
 * Constructs the critical system directive injected into the agent context
 * when the reversal threshold is breached.
 */

/**
 * Builds the interrupt directive string.
 *
 * @param failureCount - Number of consecutive identical failures detected
 * @param signature - Normalized error signature that triggered the reversal
 */
export function buildInterruptDirective(failureCount: number, signature: string): string {
  return [
    '═'.repeat(72),
    'CRITICAL SYSTEM INTERRUPT — RABBIT HOLE REVERSER ACTIVATED',
    '═'.repeat(72),
    '',
    `Identical failure detected ${failureCount} consecutive times.`,
    `Error signature: "${signature}"`,
    '',
    'ALL CODE MODIFICATIONS ARE HALTED.',
    '',
    'MANDATORY NEXT STEPS:',
    '1. DO NOT retry the same approach.',
    '2. Analyze the diff that was just reset.',
    '3. Propose an ALTERNATE ARCHITECTURAL DESIGN in plain text.',
    '4. Await explicit engineer approval before writing any code.',
    '',
    'Strategy invalidated. Workspace has been reset to HEAD~1.',
    '═'.repeat(72),
  ].join('\n');
}
