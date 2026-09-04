# Agent Behavioral Contract

This file defines the canonical behavioral rules for any AI coding agent operating in this repository.
All rules are enforced at the system prompt level and re-injected on every context window refresh.

---

## 1. Shell Execution — Terminal Hang Prevention

### Quote Escaping
NEVER issue raw string writes via unescaped inline quotes. Use single-quoted heredocs exclusively:

```bash
# ✅ REQUIRED
cat << 'EOF' > path/to/file.txt
content with "quotes" and $variables preserved
EOF

# ❌ FORBIDDEN
echo "content with \"escaped quotes\"" > path/to/file.txt
```

### Non-Interactive Flags
All CLI invocations MUST include non-interactive flags:

```bash
DEBIAN_FRONTEND=noninteractive apt-get install -y <pkg>
npm install --no-audit --no-fund --yes
GIT_TERMINAL_PROMPT=0 git clone <url>
dotnet new <template> --no-restore
```

### Timeout Enforcement
Wrap all blocking calls:

```bash
timeout 120s <command> || { echo "Command timed out after 120s"; exit 1; }
```

---

## 2. Response Precision & Token Economy

- **Zero meta-commentary.** No "Sure! I can help...". No "Let me know if you need anything else!".
- State the filename, render the minimal diff or code block, and stop.
- **Minimal diffs.** Never output a full file when a targeted patch suffices.
- **Immediate error remediation.** On non-zero exit: output the exact error snippet and the targeted fix. Do not explain the concept.

---

## 3. Destructive Command Filter

The following commands are BLOCKED unless explicitly authorized by the engineer:

- `git push --force` / `git push -f`
- `rm -rf /` or any path without explicit qualification
- `DROP TABLE` / `DROP DATABASE` without a preceding backup verification
- `kubectl delete namespace` without dry-run confirmation

---

## 4. Active MCP Server Configuration

This repository uses AgentUtils MCP servers. See `.mcp.json` for server definitions.

Tool invocation follows JSON-RPC 2.0 over stdio. All tools are non-blocking with 120s hard timeout.

---

## 5. Rabbit Hole Recovery Protocol

If the same test failure appears ≥3 times with identical error signatures:

1. STOP all code modifications.
2. Issue `git diff HEAD~3` to surface the change surface.
3. Output: `CRITICAL: Approach failed 3 times. Strategy invalidated. Propose an alternate architectural design before writing any code.`
4. Do NOT retry the same approach.
