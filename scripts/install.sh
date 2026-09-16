#!/usr/bin/env bash
# AgentUtils — Unified Global Installation Script
# Detects OS, installs all MCP server binaries to ~/.agent-utils/bin
# and links the skills library to ~/.agent-utils/skills

set -euo pipefail

INSTALL_DIR="${HOME}/.agent-utils/bin"
SKILLS_DIR="${HOME}/.agent-utils/skills"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { echo "[install.sh] $*"; }
warn() { echo "[install.sh] WARN: $*" >&2; }

log "Starting AgentUtils installation..."
log "Repo root: ${REPO_ROOT}"
log "Install dir: ${INSTALL_DIR}"

mkdir -p "${INSTALL_DIR}"
mkdir -p "${SKILLS_DIR}"

# ── Node / Sys MCP servers ─────────────────────────────────────────────────
install_node_servers() {
  log "Building Node MCP servers..."
  if ! command -v node &>/dev/null; then
    warn "node not found — skipping Node MCP servers"
    return
  fi

  cd "${REPO_ROOT}/mcp-servers/node"
  npm install --no-audit --no-fund --silent
  npm run build

  cd "${REPO_ROOT}/mcp-servers/sys"
  npm install --no-audit --no-fund --silent
  npm run build

  cd "${REPO_ROOT}/mcp-servers/infra"
  npm install --no-audit --no-fund --silent
  npm run build

  # Create wrapper scripts
  cat > "${INSTALL_DIR}/agent-mcp-node" << 'WRAPPER'
#!/usr/bin/env bash
node "$(dirname "$0")/../../mcp-servers/node/dist/server.js" "$@"
WRAPPER
  chmod +x "${INSTALL_DIR}/agent-mcp-node"

  cat > "${INSTALL_DIR}/agent-mcp-sys" << 'WRAPPER'
#!/usr/bin/env bash
node "$(dirname "$0")/../../mcp-servers/sys/dist/server.js" "$@"
WRAPPER
  chmod +x "${INSTALL_DIR}/agent-mcp-sys"
  ln -sf "${INSTALL_DIR}/agent-mcp-sys" "${INSTALL_DIR}/agent-utils-sys"

  cat > "${INSTALL_DIR}/agent-mcp-infra" << 'WRAPPER'
#!/usr/bin/env bash
node "$(dirname "$0")/../../mcp-servers/infra/dist/server.js" "$@"
WRAPPER
  chmod +x "${INSTALL_DIR}/agent-mcp-infra"

  log "✅ Node MCP servers installed"
}

# ── Go MCP server ─────────────────────────────────────────────────────────
install_go_server() {
  log "Building Go MCP server..."
  if ! command -v go &>/dev/null; then
    warn "go not found — skipping Go MCP server"
    return
  fi

  cd "${REPO_ROOT}/mcp-servers/go"
  go build -o "${INSTALL_DIR}/agent-mcp-go" ./...
  log "✅ Go MCP server installed: ${INSTALL_DIR}/agent-mcp-go"
}

# ── Python MCP server ─────────────────────────────────────────────────────
install_python_server() {
  log "Building Python MCP server..."
  if ! command -v python3 &>/dev/null; then
    warn "python3 not found — skipping Python MCP server"
    return
  fi

  cd "${REPO_ROOT}/mcp-servers/python"
  pip install --quiet -e "." --target "${INSTALL_DIR}/py_agent_mcp"

  cat > "${INSTALL_DIR}/agent-mcp-python" << 'WRAPPER'
#!/usr/bin/env bash
python3 -m agent_mcp_python.server "$@"
WRAPPER
  chmod +x "${INSTALL_DIR}/agent-mcp-python"
  log "✅ Python MCP server installed"
}

# ── .NET MCP server ───────────────────────────────────────────────────────
install_dotnet_server() {
  log "Building .NET MCP server..."
  if ! command -v dotnet &>/dev/null; then
    warn "dotnet not found — skipping .NET MCP server"
    return
  fi

  cd "${REPO_ROOT}/mcp-servers/dotnet"
  dotnet publish -c Release -o "${INSTALL_DIR}/dotnet_agent_mcp" --no-restore 2>/dev/null || dotnet publish -c Release -o "${INSTALL_DIR}/dotnet_agent_mcp"
  log "✅ .NET MCP server installed"
}

# ── Skills library ───────────────────────────────────────────────────────
install_skills() {
  log "Installing AgentUtils skills library..."
  local src="${REPO_ROOT}/.agents"

  if [ ! -d "${src}" ]; then
    warn ".agents/ directory not found — skipping skills install"
    return
  fi

  # Symlink the entire .agents dir for live updates
  ln -sfn "${src}/skills" "${SKILLS_DIR}/skills"
  ln -sfn "${src}/rules"  "${SKILLS_DIR}/rules"

  log "✅ Skills linked: ${SKILLS_DIR}"
  log "   Skills: ${src}/skills"
  log "   Rules:  ${src}/rules"
}

install_node_servers
install_go_server
install_python_server
install_dotnet_server
install_skills

# ── PATH hint ─────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────"
echo "✅ AgentUtils installation complete!"
echo ""
echo "Add to your shell profile:"
echo '  export PATH="$HOME/.agent-utils/bin:$PATH"'
echo ""
echo "Initialize a project with:"
echo '  npx @age-ents/cli init'
echo "────────────────────────────────────────────────────"
