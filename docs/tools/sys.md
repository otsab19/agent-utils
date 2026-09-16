# System MCP Server (`@age-ents/mcp-sys`)

This server provides safe OS-level primitives like command execution and port inspection. It enforces safety timeouts and blocks destructive shell commands.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-node
make build-node
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/sys
npm install
npm run build
node dist/server.js
```

## Tools

### `sys_safe_exec`
Executes a bash/zsh command with strict guardrails.
- **Guardrails:**
  - Enforces a timeout (default 120s).
  - Automatically suppresses interactive prompts (e.g., `DEBIAN_FRONTEND=noninteractive`).
  - Uses regex to block destructive commands (`rm -rf /`, `git push --force`, fork bombs).
- **Parameters:**
  - `command` (string): The shell command to run.
  - `timeoutMs` (number, optional): Override the default timeout.
  - `cwd` (string, optional): Working directory.
- **Usage Context:** Used by almost all skills when a specialized MCP tool isn't available (e.g., running `npx playwright` for `visual-qa`).

### `sys_port_inspect`
Checks which process is using a specific port.
- **Usage Context:** Used by `rabbit-hole-reverser` when an "EADDRINUSE" test failure occurs.

### `sys_path_verify`
Safely verifies file/directory existence, permissions, and symlink targets without executing shell commands.
- **Usage Context:** Used by `scope-guard` to verify checkpoints.
