/**
 * Dependency Sleuth — Build Log Parser
 *
 * Parses raw build/install error output to extract:
 *  - Package name
 *  - Target runtime/language
 *  - Error hash (stable identifier for registry lookup)
 */

export interface ParsedDependencyError {
  packageName: string;
  runtime: 'node' | 'python' | 'go' | 'dotnet' | 'jvm' | 'unknown';
  errorType: 'peer-conflict' | 'missing-native' | 'resolution-failure' | 'unknown';
  errorHash: string;
  rawSnippet: string;
}

/** Extracts a 6-char stable hash from the error content */
function hashError(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(6, '0').slice(0, 6);
}

const RUNTIME_PATTERNS: Array<{ pattern: RegExp; runtime: ParsedDependencyError['runtime'] }> = [
  { pattern: /npm ERR!|yarn error|ERESOLVE|peer dep/i, runtime: 'node' },
  { pattern: /pip.*ERROR|poetry.*error|Could not find a version/i, runtime: 'python' },
  { pattern: /go: .*@|module.*not found|go.sum/i, runtime: 'go' },
  { pattern: /NETSDK|NuGet|dotnet restore/i, runtime: 'dotnet' },
  { pattern: /Caused by:|ClassNotFoundException|gradle.*FAILED/i, runtime: 'jvm' },
];

const ERROR_TYPE_PATTERNS: Array<{
  pattern: RegExp;
  type: ParsedDependencyError['errorType'];
}> = [
  { pattern: /peer dep|ERESOLVE|conflict/i, type: 'peer-conflict' },
  { pattern: /native|node-gyp|binding|prebuild/i, type: 'missing-native' },
  { pattern: /could not resolve|not found|no matching|resolution/i, type: 'resolution-failure' },
];

const PACKAGE_PATTERNS: RegExp[] = [
  /npm ERR! peer (\S+)@/,
  /Could not find a version.*for (\S+)/,
  /go: ([\w.\-/]+)@/,
  /Package '([\w.\-]+)'/,
  /require\('([\w.\-/@]+)'\)/,
  /import ([\w.\-/@]+)/,
];

/**
 * Parses a raw build error log into a structured dependency error descriptor.
 */
export function parseBuildError(rawLog: string): ParsedDependencyError {
  const lines = rawLog.split('\n').filter(Boolean);
  const snippet = lines.slice(0, 20).join('\n');

  let runtime: ParsedDependencyError['runtime'] = 'unknown';
  for (const { pattern, runtime: r } of RUNTIME_PATTERNS) {
    if (pattern.test(rawLog)) {
      runtime = r;
      break;
    }
  }

  let errorType: ParsedDependencyError['errorType'] = 'unknown';
  for (const { pattern, type } of ERROR_TYPE_PATTERNS) {
    if (pattern.test(rawLog)) {
      errorType = type;
      break;
    }
  }

  let packageName = 'unknown';
  for (const pattern of PACKAGE_PATTERNS) {
    const match = rawLog.match(pattern);
    if (match?.[1]) {
      packageName = match[1];
      break;
    }
  }

  return {
    packageName,
    runtime,
    errorType,
    errorHash: hashError(snippet),
    rawSnippet: snippet,
  };
}
