/**
 * js_bundle_inspect — Evaluates package impact on bundle weight via esbuild dry-runs.
 */

import { execSync } from 'node:child_process';
import type { McpTool } from '../types.js';

export const jsBundleInspect: McpTool = {
  name: 'js_bundle_inspect',
  description: 'Analyzes package bundle impact via esbuild dry-run',
  async handler(params) {
    const packageName = params['packageName'] as string;
    if (!packageName) throw new Error('Required param: packageName');

    const entryCode = `import '${packageName}';`;
    const tmpEntry = `/tmp/agent-bundle-probe-${Date.now()}.js`;

    const { writeFileSync } = await import('node:fs');
    writeFileSync(tmpEntry, entryCode);

    let result = '';
    let sizeBytes = 0;
    let error: string | null = null;

    try {
      result = execSync(
        `npx esbuild ${tmpEntry} --bundle --minify --platform=browser --analyze=verbose 2>&1 || true`,
        { timeout: 60_000, encoding: 'utf8' }
      );

      const sizeMatch = result.match(/(\d+(?:\.\d+)?)\s*(?:kb|mb|b)/i);
      if (sizeMatch) {
        const unit = sizeMatch[0].slice(-2).toLowerCase();
        const value = parseFloat(sizeMatch[1]);
        sizeBytes = unit === 'kb' ? value * 1024 : unit === 'mb' ? value * 1024 * 1024 : value;
      }
    } catch (e) {
      error = String(e);
    }

    return {
      packageName,
      estimatedBundleSizeBytes: sizeBytes,
      estimatedBundleSizeKb: Math.round(sizeBytes / 1024),
      analyzeOutput: result.slice(0, 2000),
      error,
    };
  },
};
