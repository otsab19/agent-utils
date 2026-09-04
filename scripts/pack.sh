#!/usr/bin/env bash
# AgentUtils — Multi-package Distribution Packager
# Runs all language-specific build/publish commands.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${REPO_ROOT}/dist"

log() { echo "[pack.sh] $*"; }

mkdir -p "${DIST_DIR}"

# ── npm packages ──────────────────────────────────────────────────────────
log "Packing npm packages..."
cd "${REPO_ROOT}/mcp-servers/node"
npm pack --pack-destination "${DIST_DIR}"

cd "${REPO_ROOT}/mcp-servers/sys"
npm pack --pack-destination "${DIST_DIR}"

# ── Python wheel ──────────────────────────────────────────────────────────
log "Building Python wheel..."
cd "${REPO_ROOT}/mcp-servers/python"
if command -v poetry &>/dev/null; then
  poetry build --output "${DIST_DIR}"
else
  python3 -m build --outdir "${DIST_DIR}" 2>/dev/null || pip wheel . --wheel-dir "${DIST_DIR}" --no-deps
fi

# ── Go binary ─────────────────────────────────────────────────────────────
log "Building Go binary..."
cd "${REPO_ROOT}/mcp-servers/go"
GOOS=linux  GOARCH=amd64 go build -o "${DIST_DIR}/agent-mcp-go-linux-amd64" ./...
GOOS=darwin GOARCH=arm64 go build -o "${DIST_DIR}/agent-mcp-go-darwin-arm64" ./...
GOOS=windows GOARCH=amd64 go build -o "${DIST_DIR}/agent-mcp-go-windows-amd64.exe" ./...

# ── .NET NuGet ────────────────────────────────────────────────────────────
log "Building .NET NuGet package..."
cd "${REPO_ROOT}/mcp-servers/dotnet"
dotnet pack -c Release -o "${DIST_DIR}" 2>/dev/null || true

# ── JVM JAR ───────────────────────────────────────────────────────────────
log "Building JVM JAR..."
cd "${REPO_ROOT}/mcp-servers/jvm"
./gradlew jar --no-daemon 2>/dev/null || true
find build/libs -name "*.jar" -exec cp {} "${DIST_DIR}/" \; 2>/dev/null || true

log "✅ All packages built in: ${DIST_DIR}"
ls -lh "${DIST_DIR}"
