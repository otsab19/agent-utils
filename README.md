# AgentUtils

> **Universal AI Coding Agent Toolkit — MCP Servers + Agent Skills**

[![CI](https://github.com/your-org/agent-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/agent-utils/actions/workflows/ci.yml)
[![Release](https://github.com/your-org/agent-utils/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/agent-utils/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@agent-utils/cli)](https://www.npmjs.com/package/@agent-utils/cli)

A distributable toolkit for AI coding agents. Install once, use in every project.

Two layers:
1. **Agent Skills** — structured workflows that make agents disciplined engineers, not just code generators
2. **MCP Servers** — live runtime tools (type-checkers, AST analyzers, registry clients) that skills call during execution

---

## Installation

Three ways, depending on your agent:

### Option A — `npx init` (copies files into your repo)

Works with **every agent**: AGY, Claude Code, Cursor, Copilot, Windsurf. Files are version-controlled with your project.

```bash
npx @agent-utils/cli init
```

Creates `.agents/skills/`, `.agents/rules/`, `AGENTS.md`, `CONTEXT.md`, `.mcp.json` in the current directory. Commit them. Done.

### Option B — AGY/Antigravity plugin (global, zero file copying)

Install once, skills load in every AGY session automatically:

```json
// ~/.gemini/config/plugins.json
{
  "plugins": [
    { "path": "/path/to/agent-utils/.agents/plugins/agent-utils" }
  ]
}
```

Or via the `agy` CLI (if supported): `agy plugin add github:your-org/agent-utils`

### Option C — Claude Code plugin (global, slash commands)

Install once, skills load as slash commands in every Claude Code session:

```bash
claude plugin add github:your-org/agent-utils
```

Skills become `/tracer-bullet`, `/tdd-loop`, `/scope-guard` etc. in any project.

---

## Agent Skills

Unlike static markdown prompts, **every skill integrates with live MCP tools** — they don't just give instructions, they execute type-checkers, AST analyzers, and registry clients during the workflow.

### Engineering Skills

| Skill | Trigger | MCP Integration | Purpose |
|---|---|---|---|
| **tracer-bullet** | User | `ts_typecheck_stream` | Build features as thin vertical slices with type-gate on each slice |
| **scope-guard** | User | `sys_safe_exec` | Socratic interview + git checkpoint before any significant change |
| **rabbit-hole-reverser** | Auto (3+ failures) | `go_test_isolate`, `py_env_probe`, `node_runtime_eval` | Force strategy reset on repeated failures |
| **dependency-sleuth** | User | `node_runtime_eval` | Resolve dependency conflicts via live registry queries |
| **legacy-cartographer** | User | `go_ast_inspect`, `py_ast_tracer` | Characterization tests before refactoring untested code |
| **cost-profiler** | Auto (DB/API/loops) | `js_bundle_inspect`, `go_ast_inspect`, `py_ast_tracer` | Detect N+1, billing risk, bundle regressions |
| **visual-qa** | Next.js/React layout or styling changes | `sys_safe_exec` (Playwright) | Spins up `playwright` or `puppeteer` to snapshot a visual diff, ensuring CSS changes don't break the layout. |
| **test-strategist** | Request to write tests | - | Analyzes code complexity to generate an edge-case-debated unit test plan, enforcing BDD naming conventions. |
| **tdd-loop** | User | `ts_typecheck_stream` | Seam-first red-green-refactor with type gate |
| **bug-isolator** | User | `go_ast_inspect`, `py_ast_tracer` | Minimal reproduction before any fix is written |

### Guardrail Rules (always on)

| Rule | Effect |
|---|---|
| **shell-safety** | Non-interactive flags, heredoc-only writes, 120s timeouts, destructive command filter |
| **token-economy** | Zero meta-commentary, minimal diffs, structured output, one question at a time |

---

## MCP Servers

| Server | Package | Tools |
|---|---|---|
| Node/TS | [`@agent-utils/mcp-node`](docs/tools/node.md) | `ts_typecheck_stream`, `js_bundle_inspect`, `node_runtime_eval` |
| Go | [`github.com/your-org/agent-utils/mcp-servers/go`](docs/tools/go.md) | `go_ast_inspect`, `go_test_isolate`, `go_mod_graph` |
| Python | [`agent-utils-mcp` (PyPI)](docs/tools/python.md) | `py_ast_tracer`, `py_env_probe`, `py_mem_profile` |
| .NET | [`AgentUtils.MCP` (NuGet)](docs/tools/dotnet.md) | `dotnet_roslyn_analyze`, `dotnet_test_runner`, `dotnet_nuget_audit` |
| JVM | [`io.agentutils:mcp-java` (Maven)](docs/tools/jvm.md) | `jvm_gradle_diagnose`, `jvm_stacktrace_unpack`, `jvm_bytecode_signature` |
| System | [`@agent-utils/mcp-sys`](docs/tools/sys.md) | `sys_safe_exec`, `sys_port_inspect`, `sys_path_verify`, `sys_complexity_analyzer` |
| Infra | [`@agent-utils/mcp-infra`](docs/tools/infra.md) | `infra_db_query`, `infra_aws_cli`, `infra_azure_cli`, `infra_k8s_exec`, `infra_mq_inspect` |

---

## Repository Structure

```
agent-utils/
├── .agents/                    # Skills for this repo (contributors)
│   ├── skills/engineering/     # 9 engineering skills
│   └── rules/                  # 2 always-on guardrail rules
│
├── packages/
│   └── cli/                    # @agent-utils/cli — npx init command
│       ├── src/
│       │   ├── index.ts        # Commander CLI
│       │   ├── detect-stack.ts # Language detection
│       │   └── scaffold.ts     # File scaffolding
│       └── templates/          # Skill/config templates copied into projects
│
├── mcp-servers/
│   ├── node/                   # @agent-utils/mcp-node
│   ├── go/                     # Go module MCP server
│   ├── python/                 # PyPI package
│   ├── dotnet/                 # NuGet package
│   ├── jvm/                    # Maven/Gradle package
│   └── sys/                    # @agent-utils/mcp-sys
│
├── core/                       # Shared TypeScript logic
├── configs/templates/          # Raw config file templates
└── scripts/
    ├── install.sh              # Global binary + skills install
    └── pack.sh                 # Multi-registry packaging
```

---

## Development Setup

### Prerequisites

| Toolchain | Version |
|---|---|
| Node.js | ≥ 20.x |
| Go | ≥ 1.22 |
| Python | ≥ 3.11 |
| .NET SDK | ≥ 8.0 |
| OpenJDK | ≥ 21 |

### Install everything locally

```bash
git clone https://github.com/your-org/agent-utils.git
cd agent-utils
make bootstrap      # install all dependencies (including CLI)
make test-all       # run all tests
```

### Global install (makes binaries available as CLI tools)

```bash
bash scripts/install.sh
# Add to shell profile:
export PATH="$HOME/.agent-utils/bin:$PATH"
```

---

## Using the CLI

```bash
# Initialize with all skills and auto-detected MCP servers
npx @agent-utils/cli init

# Engineering skills only, Node+Sys MCP
npx @agent-utils/cli init --skills=engineering --mcp=node,sys

# Preview without writing
npx @agent-utils/cli init --dry-run

# List all available skills
npx @agent-utils/cli list-skills
```

---

## Publishing

| Component | Registry | Package |
|---|---|---|
| CLI + skill templates | npm | `@agent-utils/cli` |
| Node/TS MCP server | npm | `@agent-utils/mcp-node` |
| System MCP server | npm | `@agent-utils/mcp-sys` |
| Python MCP server | PyPI | `agent-utils-mcp` |
| Go MCP server | Go Modules | `github.com/your-org/agent-utils/mcp-servers/go` |
| .NET MCP server | NuGet | `AgentUtils.MCP` |
| JVM MCP server | Maven Central | `io.agentutils:mcp-java` |

```bash
make package-all    # build all distribution artifacts to ./dist/
```

---

## License

MIT
