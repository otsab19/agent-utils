/**
 * Legacy Code Cartographer — File Modification Guard
 *
 * Prevents modification of target files until a behavior contract is established.
 */

import * as path from 'node:path';

const lockedFiles = new Set<string>();
const contractedFiles = new Set<string>();

/**
 * Locks a file against modification.
 *
 * @param filePath - Absolute path to the file to lock
 */
export function lockFile(filePath: string): void {
  lockedFiles.add(path.resolve(filePath));
}

/**
 * Checks whether a file is currently locked.
 */
export function isLocked(filePath: string): boolean {
  return lockedFiles.has(path.resolve(filePath));
}

/**
 * Marks a file as contracted (behavior contract established).
 * Removes the modification lock.
 */
export function markContracted(filePath: string): void {
  const resolved = path.resolve(filePath);
  contractedFiles.add(resolved);
  lockedFiles.delete(resolved);
}

/**
 * Returns a directive string if the file is locked.
 */
export function getGuardDirective(filePath: string): string | null {
  if (!isLocked(filePath)) return null;
  return [
    `BLOCKED: "${path.basename(filePath)}" is locked by the Legacy Code Cartographer.`,
    'A behavior contract must be established before this file can be modified.',
    'Run the cartographer synthesizer to generate characterization tests first.',
  ].join('\n');
}
