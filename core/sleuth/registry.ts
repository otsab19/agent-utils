/**
 * Dependency Sleuth — Registry Query Client
 *
 * Queries public package registries and GitHub to find working version pins
 * and known issue resolutions.
 */

import type { ParsedDependencyError } from './parser.js';

export interface RegistryResult {
  source: string;
  packageName: string;
  latestStableVersion: string | null;
  knownWorkingVersion: string | null;
  issueUrl: string | null;
  notes: string;
}

/** Queries the npm registry for package version info */
async function queryNpm(packageName: string): Promise<RegistryResult> {
  // TODO: implement real npm registry HTTP call
  // GET https://registry.npmjs.org/${packageName}
  console.log(`[Sleuth] Querying npm for: ${packageName}`);
  return {
    source: 'npm',
    packageName,
    latestStableVersion: null,
    knownWorkingVersion: null,
    issueUrl: `https://www.npmjs.com/package/${packageName}`,
    notes: 'TODO: Implement npm registry query',
  };
}

/** Queries PyPI for package version info */
async function queryPypi(packageName: string): Promise<RegistryResult> {
  // TODO: implement real PyPI API call
  // GET https://pypi.org/pypi/${packageName}/json
  console.log(`[Sleuth] Querying PyPI for: ${packageName}`);
  return {
    source: 'pypi',
    packageName,
    latestStableVersion: null,
    knownWorkingVersion: null,
    issueUrl: `https://pypi.org/project/${packageName}`,
    notes: 'TODO: Implement PyPI registry query',
  };
}

/** Queries pkg.go.dev for Go module info */
async function queryGoPkg(packageName: string): Promise<RegistryResult> {
  // TODO: implement pkg.go.dev query
  console.log(`[Sleuth] Querying pkg.go.dev for: ${packageName}`);
  return {
    source: 'go-modules',
    packageName,
    latestStableVersion: null,
    knownWorkingVersion: null,
    issueUrl: `https://pkg.go.dev/${packageName}`,
    notes: 'TODO: Implement Go module registry query',
  };
}

const REGISTRY_HANDLERS: Record<string, (pkg: string) => Promise<RegistryResult>> = {
  node: queryNpm,
  python: queryPypi,
  go: queryGoPkg,
};

/**
 * Routes a parsed dependency error to the appropriate registry and returns
 * version information and known issue data.
 */
export async function queryRegistry(
  error: ParsedDependencyError
): Promise<RegistryResult> {
  const handler = REGISTRY_HANDLERS[error.runtime];
  if (!handler) {
    return {
      source: 'unknown',
      packageName: error.packageName,
      latestStableVersion: null,
      knownWorkingVersion: null,
      issueUrl: null,
      notes: `No registry handler for runtime: ${error.runtime}`,
    };
  }
  return handler(error.packageName);
}
