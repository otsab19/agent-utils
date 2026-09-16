/**
 * Stack detection — reads project files to determine which languages/runtimes
 * are present so the CLI can configure the right MCP servers and skills.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ProjectStack {
  node: boolean;
  typescript: boolean;
  python: boolean;
  go: boolean;
  dotnet: boolean;
  jvm: boolean;
  frontend: boolean;
}

export async function detectStack(cwd: string): Promise<ProjectStack> {
  const exists = (file: string) => existsSync(join(cwd, file));

  const node = exists('package.json');
  const typescript = node && (
    exists('tsconfig.json') ||
    exists('tsconfig.base.json') ||
    hasDevDep(cwd, 'typescript')
  );

  const python = exists('pyproject.toml') ||
    exists('setup.py') ||
    exists('requirements.txt') ||
    exists('Pipfile');

  const go = exists('go.mod');

  const dotnet = exists('*.csproj') ||
    exists('*.fsproj') ||
    exists('*.sln') ||
    glob(cwd, ['**/*.csproj', '**/*.fsproj', '**/*.sln']);

  const jvm = exists('build.gradle') ||
    exists('build.gradle.kts') ||
    exists('pom.xml');

  const frontend = typescript && (
    hasDep(cwd, 'react') ||
    hasDep(cwd, 'vue') ||
    hasDep(cwd, 'svelte') ||
    hasDep(cwd, 'next') ||
    hasDep(cwd, 'nuxt') ||
    hasDep(cwd, '@angular/core')
  );

  return { node, typescript, python, go, dotnet, jvm, frontend };
}

function hasDevDep(cwd: string, dep: string): boolean {
  return hasDep(cwd, dep, true);
}

function hasDep(cwd: string, dep: string, devOnly = false): boolean {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
    if (!devOnly && pkg.dependencies?.[dep]) return true;
    if (pkg.devDependencies?.[dep]) return true;
    return false;
  } catch {
    return false;
  }
}

function glob(cwd: string, patterns: string[]): boolean {
  // Lightweight check for common patterns without needing glob dependency
  for (const pattern of patterns) {
    const ext = pattern.split('*').pop();
    if (ext) {
      try {
        const { readdirSync } = require('fs');
        const files = readdirSync(cwd, { recursive: true }) as string[];
        if (files.some((f: string) => f.endsWith(ext))) return true;
      } catch {
        return false;
      }
    }
  }
  return false;
}
