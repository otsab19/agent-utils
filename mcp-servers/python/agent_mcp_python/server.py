"""
agent-mcp-python — Python MCP Server

Exposes Python-specific tooling over JSON-RPC 2.0 via stdio.
Tools: py_ast_tracer, py_env_probe, py_mem_profile
"""

from __future__ import annotations

import ast
import importlib.util
import json
import logging
import sys
import tracemalloc
from pathlib import Path
from typing import Any

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
log = logging.getLogger("agent-mcp-python")


# ─── Tool Implementations ─────────────────────────────────────────────────────


def py_ast_tracer(params: dict[str, Any]) -> dict[str, Any]:
    """
    Inspects dynamic typing, variable assignments, and cyclomatic complexity
    via the native ast and dis modules.

    params: { "filePath": str }
    """
    file_path = params.get("filePath")
    if not file_path:
        raise ValueError("Required param: filePath")

    source = Path(file_path).read_text(encoding="utf-8")
    tree = ast.parse(source, filename=file_path)

    functions: list[dict] = []
    assignments: list[dict] = []

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            # Compute cyclomatic complexity (simplified: 1 + branch count)
            branches = sum(
                1
                for n in ast.walk(node)
                if isinstance(n, (ast.If, ast.While, ast.For, ast.ExceptHandler, ast.With))
            )
            functions.append(
                {
                    "name": node.name,
                    "line": node.lineno,
                    "isAsync": isinstance(node, ast.AsyncFunctionDef),
                    "cyclomaticComplexity": 1 + branches,
                    "args": [a.arg for a in node.args.args],
                }
            )

        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    assignments.append({"name": target.id, "line": node.lineno})

    return {
        "filePath": file_path,
        "functions": functions,
        "assignments": assignments,
        "totalNodes": sum(1 for _ in ast.walk(tree)),
    }


def py_env_probe(params: dict[str, Any]) -> dict[str, Any]:
    """
    Identifies virtualenv collisions, missing binaries, and interpreter mismatches.

    params: { "packageName": str? }
    """
    import shutil
    import subprocess

    package_name = params.get("packageName")

    probe: dict[str, Any] = {
        "pythonInterpreter": sys.executable,
        "pythonVersion": sys.version,
        "virtualenv": sys.prefix != sys.base_prefix,
        "sysPrefix": sys.prefix,
        "toolAvailability": {},
    }

    for tool in ["pip", "poetry", "uv", "pipenv"]:
        probe["toolAvailability"][tool] = shutil.which(tool) is not None

    if package_name:
        spec = importlib.util.find_spec(package_name)
        probe["packageResolution"] = {
            "package": package_name,
            "found": spec is not None,
            "origin": spec.origin if spec else None,
        }

        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "show", package_name],
                capture_output=True,
                text=True,
                timeout=15,
                check=False,
            )
            probe["pipShowOutput"] = result.stdout.strip()
        except subprocess.TimeoutExpired:
            probe["pipShowOutput"] = "[timed out]"

    return probe


def py_mem_profile(params: dict[str, Any]) -> dict[str, Any]:
    """
    Wraps execution in tracemalloc to report peak allocations and pinpoint leaks.

    params: { "code": str, "topN": int? }
    """
    code = params.get("code")
    if not code:
        raise ValueError("Required param: code (Python expression or statement)")

    top_n = int(params.get("topN", 10))

    tracemalloc.start()
    try:
        exec(compile(code, "<agent-profiler>", "exec"), {})  # noqa: S102
    except Exception as exc:  # noqa: BLE001
        tracemalloc.stop()
        return {"error": f"Execution error: {exc}", "traceback": tracemalloc.get_traceback_limit()}

    snapshot = tracemalloc.take_snapshot()
    tracemalloc.stop()

    top_stats = snapshot.statistics("lineno")[:top_n]
    return {
        "peakAllocations": [
            {
                "file": str(stat.traceback[0].filename) if stat.traceback else "unknown",
                "line": stat.traceback[0].lineno if stat.traceback else 0,
                "sizeBytes": stat.size,
                "count": stat.count,
            }
            for stat in top_stats
        ],
        "totalAllocatedBytes": sum(s.size for s in top_stats),
    }


# ─── JSON-RPC Dispatch ────────────────────────────────────────────────────────

TOOL_REGISTRY: dict[str, Any] = {
    "py_ast_tracer": py_ast_tracer,
    "py_env_probe": py_env_probe,
    "py_mem_profile": py_mem_profile,
}


def dispatch(request: dict[str, Any]) -> dict[str, Any]:
    req_id = request.get("id")
    method = request.get("method", "")
    params = request.get("params") or {}

    handler = TOOL_REGISTRY.get(method)
    if not handler:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }

    try:
        result = handler(params)
        return {"jsonrpc": "2.0", "id": req_id, "result": result}
    except Exception as exc:  # noqa: BLE001
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32000, "message": str(exc)},
        }


def main() -> None:
    log.info("agent-mcp-python started (transport: stdio)")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as exc:
            response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {exc}"},
            }
            print(json.dumps(response), flush=True)
            continue

        response = dispatch(request)
        print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()
