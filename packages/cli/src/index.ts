#!/usr/bin/env node
/**
 * @otsab190/cli — init command
 *
 * Usage:
 *   npx @otsab190/cli init
 *   npx @otsab190/cli init --skills=engineering --mcp=node,go
 */

import { program } from 'commander';
import pc from 'picocolors';
import { detectStack } from './detect-stack.js';
import { scaffold } from './scaffold.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('agent-utils')
  .description('AgentUtils — Initialize agent skills and MCP config in any project')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize AgentUtils in the current project')
  .option(
    '--skills <categories>',
    'Comma-separated skill categories to install: engineering,guardrails,all',
    'all'
  )
  .option(
    '--mcp <servers>',
    'Comma-separated MCP servers to configure: node,go,python,dotnet,jvm,sys,all',
    'all'
  )
  .option('--dry-run', 'Preview what would be created without writing files', false)
  .action(async (opts) => {
    console.log(pc.bold(pc.cyan('\n⚡ AgentUtils Init\n')));

    // 1. Detect stack
    const stack = await detectStack(process.cwd());
    console.log(pc.dim('Detected stack:'));
    for (const [lang, detected] of Object.entries(stack)) {
      if (detected) console.log(pc.dim(`  ✓ ${lang}`));
    }
    console.log('');

    // 2. Parse options
    const skillCategories = opts.skills === 'all'
      ? ['engineering', 'guardrails']
      : (opts.skills as string).split(',').map((s: string) => s.trim());

    const mcpServers = opts.mcp === 'all'
      ? inferMcpServers(stack)
      : (opts.mcp as string).split(',').map((s: string) => s.trim());

    // 3. Scaffold
    await scaffold({
      cwd: process.cwd(),
      skillCategories,
      mcpServers,
      stack,
      dryRun: opts.dryRun as boolean,
    });

    if (!opts.dryRun) {
      console.log(pc.green('\n✅ AgentUtils initialized!\n'));
      console.log(pc.bold('What was created:'));
      console.log('  .agents/skills/    — Agent skill library');
      console.log('  .agents/rules/     — Always-on guardrail rules');
      console.log('  .mcp.json          — MCP server config');
      console.log('  AGENTS.md          — Agent behavioral contract');
      console.log('  CONTEXT.md         — Project context (fill this in!)');
      console.log('');
      console.log(pc.bold('Next steps:'));
      console.log('  1. Fill in CONTEXT.md with your project domain');
      console.log('  2. Review .mcp.json and update binary paths if needed');
      console.log('  3. Commit everything to version control');
      console.log(pc.dim('\n  Run with --dry-run to preview changes without writing files'));
    }
  });

program
  .command('list-skills')
  .description('List all available skills')
  .action(() => {
    const skills = [
      { name: 'tracer-bullet',        category: 'engineering', desc: 'Build features as thin vertical slices with type-gate' },
      { name: 'scope-guard',          category: 'engineering', desc: 'Interview + git checkpoint before any significant change' },
      { name: 'rabbit-hole-reverser', category: 'engineering', desc: 'Force strategy reset on 3+ repeated failures' },
      { name: 'dependency-sleuth',    category: 'engineering', desc: 'Resolve dependency conflicts via live registry queries' },
      { name: 'legacy-cartographer',  category: 'engineering', desc: 'Characterization tests before refactoring untested code' },
      { name: 'cost-profiler',        category: 'engineering', desc: 'Detect N+1, billing risk, bundle regressions' },
      { name: 'visual-qa',            category: 'engineering', desc: 'Playwright screenshots + DOM overlap at 3 viewports' },
      { name: 'tdd-loop',             category: 'engineering', desc: 'Seam-first red-green-refactor with type gate' },
      { name: 'bug-isolator',         category: 'engineering', desc: 'Minimal reproduction before any fix is written' },
      { name: 'shell-safety',         category: 'guardrails',  desc: 'Non-interactive flags, heredocs, timeouts (always on)' },
      { name: 'token-economy',        category: 'guardrails',  desc: 'No meta-commentary, minimal diffs, structured output (always on)' },
    ];

    console.log(pc.bold('\nAvailable AgentUtils Skills\n'));
    for (const skill of skills) {
      const cat = skill.category === 'guardrails' ? pc.magenta(skill.category) : pc.cyan(skill.category);
      console.log(`  ${pc.bold(skill.name.padEnd(28))} [${cat}]`);
      console.log(`  ${pc.dim(skill.desc)}`);
      console.log('');
    }
  });

function inferMcpServers(stack: Awaited<ReturnType<typeof detectStack>>): string[] {
  const servers: string[] = ['sys', 'infra']; // always include sys and infra
  if (stack.node || stack.typescript) servers.push('node');
  if (stack.go) servers.push('go');
  if (stack.python) servers.push('python');
  if (stack.dotnet) servers.push('dotnet');
  if (stack.jvm) servers.push('jvm');
  return servers;
}

program.parse(process.argv);
