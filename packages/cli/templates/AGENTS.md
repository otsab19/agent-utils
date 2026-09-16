# Agent Behavioral Contract

This file defines the canonical behavioral rules for any AI coding agent
operating in this repository. These rules are loaded at the system prompt
level and re-evaluated on every context window refresh.

---

## 1. Shell Execution — Terminal Safety

### Non-interactive flags (mandatory)
All CLI invocations MUST include non-interactive flags:

```bash
npm install --no-audit --no-fund --yes
pip install --quiet --no-input
DEBIAN_FRONTEND=noninteractive apt-get install -y <pkg>
GIT_TERMINAL_PROMPT=0 git clone <url>
dotnet new <template> --no-restore
```

### Quote escaping — heredocs only
When writing multi-line content to files, use single-quoted heredocs:

```bash
# ✅ REQUIRED
cat << 'EOF' > path/to/file.txt
content with "quotes" and $variables
EOF

# ❌ FORBIDDEN
echo "content with \"escaped quotes\"" > path/to/file.txt
```

### Timeout enforcement
```bash
timeout 120s <command> || { echo "TIMEOUT after 120s"; exit 1; }
```

---

## 2. Response Precision & Token Economy

- **Zero meta-commentary.** No "Sure! I can help...". No "Let me know if you need anything else!".
- **Minimal diffs.** Never output a full file when a targeted patch suffices.
- **Immediate error remediation.** On non-zero exit: output the exact error snippet and the fix.
- **One question at a time.** Never bundle multiple questions.

---

## 3. Destructive Command Filter

BLOCKED unless explicitly authorized:
- `git push --force` / `git push -f`
- `rm -rf /` or unqualified broad paths
- `DROP TABLE` / `DROP DATABASE` without prior backup verification
- `kubectl delete namespace` without dry-run
- `terraform destroy` without plan review

---

## 4. Rabbit Hole Recovery Protocol

If the same test failure appears ≥3 times with identical error signatures:

1. STOP all code modifications immediately.
2. Run `git diff HEAD~3` to surface the change surface.
3. Output: `⛔ RABBIT HOLE DETECTED — Same failure 3 times. Strategy invalidated.`
4. Propose 3 alternate architectural approaches.
5. Do NOT retry the same approach.

---

## 5. MCP Tool Usage

This repository uses AgentUtils MCP servers. See `.mcp.json` for server
definitions. All tools communicate via JSON-RPC 2.0 over stdio.

**Available tools** (see CONTEXT.md for project-specific subset):

| Tool | Server | Purpose |
|---|---|---|
| `ts_typecheck_stream` | mcp-node | TypeScript type-check on specific files |
| `js_bundle_inspect` | mcp-node | Bundle size and import analysis |
| `node_runtime_eval` | mcp-node | Evaluate JS in sandboxed Node.js |
| `go_ast_inspect` | mcp-go | Go AST analysis and export surface |
| `go_test_isolate` | mcp-go | Run a specific Go test in isolation |
| `go_mod_graph` | mcp-go | Go module dependency graph |
| `py_ast_tracer` | mcp-python | AST-based call graph tracing |
| `py_env_probe` | mcp-python | Python environment inspection |
| `sys_safe_exec` | mcp-sys | Safe shell execution with timeout |
| `sys_port_inspect` | mcp-sys | Port/process inspection |
| `sys_complexity_analyzer` | mcp-sys | Cyclomatic complexity scoring |
| `infra_db_query` | mcp-infra | Safe SQL querying (read-only by default) |
| `infra_k8s_exec` | mcp-infra | Safe kubectl wrapper (read-only) |
| `infra_aws_cli` | mcp-infra | Safe AWS CLI wrapper (read-only) |
| `infra_azure_cli` | mcp-infra | Safe Azure CLI wrapper (read-only) |
| `infra_mq_inspect` | mcp-infra | Safe Kafka/RabbitMQ queue inspection |

---

## 6. Active Skills

Skills are loaded on-demand. See `.agents/skills/` for the full library.

Key skills:
- **scope-guard** — run before any significant change
- **tracer-bullet** — for building features slice by slice
- **rabbit-hole-reverser** — auto-activates on repeated failures
- **tdd-loop** — for test-driven development
- **bug-isolator** — for reproducing bugs before fixing
- **legacy-cartographer** — before touching untested code
- **dependency-sleuth** — for resolving package conflicts
- **cost-profiler** — for DB/API/loop patterns
- **visual-qa** — after any frontend file changes
