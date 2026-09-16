# Node.js MCP Server (`@agent-utils/mcp-node`)

This server provides tools for analyzing Node.js and TypeScript projects.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-node
make build-node
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/node
npm install
npm run build
node dist/server.js
```

## Tools

### `ts_typecheck_stream`
Runs a strict TypeScript compiler check on specific files to catch type errors before they are committed.
- **Parameters:**
  - `files` (array of strings): Paths to the files to type-check.
  - `strict` (boolean): Whether to run in strict mode (recommended).
- **Usage Context:** Essential for the `tdd-loop` and `tracer-bullet` skills to ensure "green" means both tests and types pass.

### `js_bundle_inspect`
Analyzes bundle size and import trees to detect regressions.
- **Parameters:**
  - `path` (string): Path to the bundle or source file.
  - `check` (string): The type of check to perform (e.g., `size_regression`).
- **Usage Context:** Used by the `cost-profiler` skill to flag accidental bloat when adding dependencies.

### `node_runtime_eval`
Evaluates JavaScript code in a sandboxed Node.js environment.
- **Parameters:**
  - `code` (string): The JavaScript code to execute.
- **Usage Context:** Used by `dependency-sleuth` to make live HTTP queries to the npm registry to resolve peer conflicts.
