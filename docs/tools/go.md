# Go MCP Server (`agent-mcp-go`)

This server provides AST analysis and isolated testing tools for Go projects.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-go
make build-go
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/go
go build -o bin/agent-mcp-go ./...
./bin/agent-mcp-go
```

## Tools

### `go_ast_inspect`
Parses Go source code into an Abstract Syntax Tree (AST) to understand exports, interfaces, and call graphs.
- **Parameters:**
  - `path` (string): Path to the package or file.
  - `mode` (string): Inspection mode (`exports`, `call_graph`, `loop_io_patterns`).
  - `filter` (string, optional): Symbol to filter on.
- **Usage Context:** Crucial for `legacy-cartographer` (generating characterization tests for undocumented code) and `bug-isolator`.

### `go_test_isolate`
Runs a specific Go test in strict isolation to capture its exact failure signature.
- **Parameters:**
  - `package` (string): The Go package path.
  - `testName` (string): Exact name of the test function.
- **Usage Context:** Used by `rabbit-hole-reverser` to fingerprint identical test failures across multiple attempts.

### `go_mod_graph`
Analyzes the `go.mod` dependency graph to resolve version conflicts.
- **Parameters:**
  - `module` (string): The module to inspect.
- **Usage Context:** Used by `dependency-sleuth` to fix ambiguous imports or Go module version conflicts.
