# Python MCP Server (`agent-mcp-python`)

This server provides AST tracing and environment profiling for Python projects.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-python
make build-python
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/python
pip install -e .
python3 -m agent_mcp_python.server
```

## Tools

### `py_ast_tracer`
Analyzes Python source code using the `ast` module to trace call graphs and loop patterns.
- **Parameters:**
  - `path` (string): Path to the Python module.
  - `extract` (string): What to extract (`public_symbols`, `call_sites`, `loop_call_patterns`).
  - `symbol` (string, optional): Specific symbol to trace.
- **Usage Context:** Powers `legacy-cartographer` (identifying inputs/outputs of legacy functions) and `cost-profiler` (detecting DB queries inside loops).

### `py_env_probe`
Inspects the local Python environment (virtualenv, site-packages).
- **Parameters:**
  - `module` (string): The module to inspect.
- **Usage Context:** Used by `dependency-sleuth` to diagnose `pip` resolution conflicts and `ModuleNotFoundError` issues.

### `py_mem_profile`
Profiles memory usage for specific Python code paths.
- **Usage Context:** Used by `cost-profiler` to flag operations that might cause OOM (Out Of Memory) errors in production.
