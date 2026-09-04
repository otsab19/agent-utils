/**
 * Dependency Sleuth — Mitigation Payload Builder
 *
 * Combines parsed error + registry data into an actionable mitigation payload.
 */

import type { ParsedDependencyError } from './parser.js';
import type { RegistryResult } from './registry.js';

export interface MitigationPayload {
  packageName: string;
  runtime: string;
  errorType: string;
  recommendedAction: string;
  versionPin: string | null;
  buildFlags: string[];
  references: string[];
}

/**
 * Builds a concise mitigation payload for the agent to act on.
 */
export function buildMitigation(
  error: ParsedDependencyError,
  registry: RegistryResult
): MitigationPayload {
  const buildFlags: string[] = [];
  const references: string[] = [];

  if (registry.issueUrl) references.push(registry.issueUrl);

  if (error.errorType === 'peer-conflict') {
    buildFlags.push('--legacy-peer-deps');
  }

  if (error.errorType === 'missing-native') {
    if (error.runtime === 'node') {
      buildFlags.push('--ignore-scripts', 'npm_config_build_from_source=true');
    }
  }

  const versionPin = registry.knownWorkingVersion ?? registry.latestStableVersion;

  let recommendedAction = `Pin ${error.packageName}`;
  if (versionPin) {
    recommendedAction += ` to ${versionPin}`;
  }
  if (buildFlags.length > 0) {
    recommendedAction += ` with flags: ${buildFlags.join(' ')}`;
  }

  return {
    packageName: error.packageName,
    runtime: error.runtime,
    errorType: error.errorType,
    recommendedAction,
    versionPin,
    buildFlags,
    references,
  };
}
