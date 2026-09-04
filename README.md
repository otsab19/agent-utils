# AgentUtils

> **Universal AI Coding Agent Toolkit & MCP Protocol Suite**

[![CI](https://github.com/your-org/agent-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/agent-utils/actions/workflows/ci.yml)
[![Release](https://github.com/your-org/agent-utils/actions/workflows/release.yml/badge.svg)](https://github.com/your-org/agent-utils/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modular runtime, MCP (Model Context Protocol) tool suite, and behavioral guardrail framework designed to supervise, extend, and stabilize AI coding agents across multiple programming languages.

---

## Architecture

```
+-------------------------------------------------------------------------+
|                         Agent Context Window                            |
|  - System Directives & Terminal Safety (.agentrules / AGENTS.md)        |
|  - Active Behavioral Guardrails                                         |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           AgentUtils Core                               |
|  +---------------------------+       +--------------------------------+ |
|  |       Agent Skills        |       |          Guardrails            | |
|  | - Rabbit Hole Reverser    |       | - Dquote / Hang Eliminator     | |
|  | - Dependency Sleuth       |       | - Destructive Command Filter   | |
|  | - Visual/Spatial QA       |       | - Non-Interactive Shell Enforcer| |
|  | - Cost-Aware Profiler     |       | - Strict Token Economy Policy  | |
|  | - Legacy Cartographer     |       |                                | |
|  +---------------------------+       +--------------------------------+ |
+-------------------------------------------------------------------------+
                        | (JSON-RPC via stdio/SSE)
                        v
+-------------------------------------------------------------------------+
|                         Language MCP Servers                            |
|   Go  |  Java  |  .NET / C#  |  Python  |  JS / TS  |  Bash / System   |
+-------------------------------------------------------------------------+
```

---

## Core Agent Skills

| Skill | Trigger | Mechanism |
|---|---|---|
| **Rabbit Hole Reverser** | ≥3 consecutive identical test failures | `git reset --hard`, strategy invalidation directive |
| **Dependency Sleuth** | Package resolution / peer conflict failures | Log parsing → registry query → version-pin payload |
| **Visual/Spatial QA** | Frontend file edits (`.tsx`, `.vue`, `.css`) | Playwright 3-viewport screenshots + DOM overlap detection |
| **Cost-Aware Profiler** | DB ops, external APIs, recursive loops | AST scan for N+1 / billing projection / threshold gate |
| **Legacy Cartographer** | Refactoring undocumented, untested modules | Black-box characterization tests → immutable behavior contract |

---

## Language MCP Servers

| Server | Package | Tools |
|---|---|---|
| Go | `github.com/your-org/agent-utils/mcp-servers/go` | `go_ast_inspect`, `go_test_isolate`, `go_mod_graph` |
| Java/JVM | `io.agentutils:mcp-java` | `jvm_gradle_diagnose`, `jvm_stacktrace_unpack`, `jvm_bytecode_signature` |
| .NET/C# | `AgentUtils.MCP` | `dotnet_roslyn_analyze`, `dotnet_test_runner`, `dotnet_nuget_audit` |
| Python | `agent-utils-mcp` (PyPI) | `py_ast_tracer`, `py_env_probe`, `py_mem_profile` |
| JS/TS | `@agent-utils/mcp-node` | `ts_typecheck_stream`, `js_bundle_inspect`, `node_runtime_eval` |
| Sys | `@agent-utils/mcp-sys` | `sys_safe_exec`, `sys_port_inspect`, `sys_path_verify` |

---

## Prerequisites

| Toolchain | Version |
|---|---|
| Docker & Docker Compose | latest |
| Node.js | ≥ 20.x |
| Go | ≥ 1.22 |
| Python | ≥ 3.11 |
| .NET SDK | ≥ 8.0 |
| OpenJDK | ≥ 21 |

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/agent-utils.git
cd agent-utils

# Install all dependencies
make bootstrap

# Launch sandbox
docker compose up -d

# Run all tests
make test-all
```

---

## Deploy into a Target Repository

```bash
npx @agent-utils/cli init
```

This generates:
- `.agentrules` — behavioral guardrails
- `AGENTS.md` — agent context contract
- `.mcp.json` — MCP server config for Claude Code, Cursor, Windsurf

---

## Publishing

| Component | Registry | Identifier |
|---|---|---|
| CLI & Universal Agent | npm | `@agent-utils/cli` |
| Python MCP & Tools | PyPI | `agent-utils-mcp` |
| Go MCP Server | Go Modules | `github.com/your-org/agent-utils/mcp-servers/go` |
| .NET Tools | NuGet | `AgentUtils.MCP` |
| Java/JVM Tooling | Maven Central | `io.agentutils:mcp-java` |
| Pre-built Sandbox | GHCR | `ghcr.io/your-org/agent-utils-sandbox:latest` |

---

## License

MIT
