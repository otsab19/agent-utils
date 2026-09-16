/**
 * Scaffold — copies skills, rules, AGENTS.md, .mcp.json, CONTEXT.md
 * into the target project directory.
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import type { ProjectStack } from './detect-stack.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../templates');

export interface ScaffoldOptions {
  cwd: string;
  skillCategories: string[];
  mcpServers: string[];
  stack: ProjectStack;
  dryRun: boolean;
}

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { cwd, skillCategories, mcpServers, stack, dryRun } = opts;

  const log = (msg: string) => console.log(dryRun ? pc.dim(`[dry-run] ${msg}`) : `  ${msg}`);
  const write = (dest: string, content: string) => {
    if (dryRun) {
      log(`Would write: ${dest}`);
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    if (existsSync(dest)) {
      log(pc.yellow(`⚠  Skipping (exists): ${dest}`));
      return;
    }
    writeFileSync(dest, content, 'utf-8');
    log(pc.green(`✓ Created: ${dest}`));
  };
  const copy = (src: string, dest: string) => {
    if (dryRun) {
      log(`Would copy: ${src} → ${dest}`);
      return;
    }
    if (existsSync(dest)) {
      log(pc.yellow(`⚠  Skipping (exists): ${dest}`));
      return;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    log(pc.green(`✓ Copied: ${dest}`));
  };

  // 1. Copy skills
  for (const category of skillCategories) {
    const srcDir = join(TEMPLATES_DIR, 'skills', category);
    const destDir = join(cwd, '.agents', 'skills', category);
    if (existsSync(srcDir)) {
      copy(srcDir, destDir);
    }
  }

  // 2. Copy guardrail rules (always)
  const rulesDir = join(TEMPLATES_DIR, 'rules');
  if (existsSync(rulesDir)) {
    copy(rulesDir, join(cwd, '.agents', 'rules'));
  }

  // 3. Write AGENTS.md
  const agentsMd = readFileSync(join(TEMPLATES_DIR, 'AGENTS.md'), 'utf-8');
  write(join(cwd, 'AGENTS.md'), agentsMd);

  // 4. Write CONTEXT.md
  const contextMd = generateContextMd(cwd, stack);
  write(join(cwd, 'CONTEXT.md'), contextMd);

  // 5. Write .mcp.json
  const mcpJson = generateMcpJson(mcpServers, stack);
  write(join(cwd, '.mcp.json'), JSON.stringify(mcpJson, null, 2));

  // 6. Write skills.json
  const skillsJson = generateSkillsJson(skillCategories);
  write(join(cwd, '.agents', 'skills.json'), JSON.stringify(skillsJson, null, 2));
}

function generateContextMd(cwd: string, stack: ProjectStack): string {
  const pkgName = (() => {
    try {
      return JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8')).name ?? 'this project';
    } catch {
      return 'this project';
    }
  })();

  return `# Project Context

This file is the canonical source of truth for agent sessions in this repository.
Update it as the project evolves. Skills like \`scope-guard\` and \`tdd-loop\`
read this file to align on domain language and established decisions.

## Project

**Name:** ${pkgName}
**Stack:** ${describeStack(stack)}
**Description:** <!-- What does this project do? One paragraph. -->

## Domain Language

<!-- Define key terms unique to this domain. Agents use this vocabulary in
     test names, commit messages, and code. Inconsistent naming is a bug. -->

| Term | Definition |
|---|---|
| <!-- term --> | <!-- definition --> |

## Architectural Decisions

<!-- Record significant decisions here. Format:
  - **Decision**: What was decided
  - **Rationale**: Why
  - **Date**: YYYY-MM-DD
-->

## Test Conventions

<!-- Where do tests live? What seams are pre-agreed? -->

- Test files: \`<!-- e.g., src/**/*.test.ts or tests/ -->\`
- Pre-agreed seams: \`<!-- e.g., HTTP endpoints, public service methods -->\`
- Mock policy: \`<!-- e.g., only infrastructure boundaries (DB, HTTP) -->\`

## MCP Tools Available

${describeTools(stack)}
`;
}

function describeStack(stack: ProjectStack): string {
  const parts: string[] = [];
  if (stack.typescript) parts.push('TypeScript');
  else if (stack.node) parts.push('Node.js');
  if (stack.python) parts.push('Python');
  if (stack.go) parts.push('Go');
  if (stack.dotnet) parts.push('.NET');
  if (stack.jvm) parts.push('JVM');
  if (stack.frontend) parts.push('Frontend');
  return parts.join(', ') || 'Unknown';
}

function describeTools(stack: ProjectStack): string {
  const tools: string[] = [];
  if (stack.node || stack.typescript) {
    tools.push('- `ts_typecheck_stream` — TypeScript type-check on specific files');
    tools.push('- `js_bundle_inspect` — Bundle size and import analysis');
    tools.push('- `node_runtime_eval` — Evaluate JS in a sandboxed Node.js runtime');
  }
  if (stack.go) {
    tools.push('- `go_ast_inspect` — Go AST analysis and export surface inspection');
    tools.push('- `go_test_isolate` — Run a specific Go test in isolation');
    tools.push('- `go_mod_graph` — Analyze Go module dependency graph');
  }
  if (stack.python) {
    tools.push('- `py_ast_tracer` — Python AST analysis and call graph tracing');
    tools.push('- `py_env_probe` — Inspect Python environment and installed packages');
    tools.push('- `py_mem_profile` — Memory usage profiling for Python code');
  }
  tools.push('- `sys_safe_exec` — Safe shell command execution with timeout');
  tools.push('- `sys_port_inspect` — Check which process is using a port');
  tools.push('- `sys_path_verify` — Verify file/directory existence and permissions');
  return tools.join('\n');
}

function generateMcpJson(servers: string[], _stack: ProjectStack): object {
  const mcpServers: Record<string, object> = {};

  if (servers.includes('node')) {
    mcpServers['agent-mcp-node'] = {
      command: 'agent-mcp-node',
      description: 'Node.js/TypeScript MCP server — ts_typecheck_stream, js_bundle_inspect, node_runtime_eval',
      env: {}
    };
  }
  if (servers.includes('go')) {
    mcpServers['agent-mcp-go'] = {
      command: 'agent-mcp-go',
      description: 'Go MCP server — go_ast_inspect, go_test_isolate, go_mod_graph',
      env: {}
    };
  }
  if (servers.includes('python')) {
    mcpServers['agent-mcp-python'] = {
      command: 'agent-mcp-python',
      description: 'Python MCP server — py_ast_tracer, py_env_probe, py_mem_profile',
      env: {}
    };
  }
  if (servers.includes('dotnet')) {
    mcpServers['agent-mcp-dotnet'] = {
      command: 'agent-mcp-dotnet',
      description: '.NET MCP server — dotnet_roslyn_analyze, dotnet_test_runner, dotnet_nuget_audit',
      env: {}
    };
  }
  if (servers.includes('jvm')) {
    mcpServers['agent-mcp-jvm'] = {
      command: 'java -jar agent-mcp-jvm.jar',
      description: 'JVM MCP server — jvm_gradle_diagnose, jvm_stacktrace_unpack, jvm_bytecode_signature',
      env: {}
    };
  }
  if (servers.includes('sys')) {
    mcpServers['agent-mcp-sys'] = {
      command: 'agent-mcp-sys',
      description: 'System MCP server — sys_safe_exec, sys_port_inspect, sys_path_verify',
      env: {}
    };
  }
  if (servers.includes('infra')) {
    mcpServers['agent-mcp-infra'] = {
      command: 'agent-mcp-infra',
      description: 'Infrastructure MCP server — infra_db_query, infra_k8s_exec, infra_aws_cli, infra_azure_cli, infra_mq_inspect',
      env: {}
    };
  }

  return { mcpServers };
}

function generateSkillsJson(categories: string[]): object {
  return {
    version: '1',
    categories,
    skills: categories.includes('engineering') ? [
      'tracer-bullet',
      'scope-guard',
      'rabbit-hole-reverser',
      'dependency-sleuth',
      'legacy-cartographer',
      'cost-profiler',
      'visual-qa',
      'tdd-loop',
      'bug-isolator'
    ] : []
  };
}
