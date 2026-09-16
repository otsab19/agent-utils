.PHONY: bootstrap test-all lint clean package-all \
        bootstrap-node bootstrap-go bootstrap-python bootstrap-dotnet bootstrap-jvm bootstrap-cli bootstrap-infra \
        test-node test-go test-python test-dotnet test-jvm test-sys test-cli test-infra \
        build-node build-go build-python build-dotnet build-jvm build-cli

# ─── Bootstrap ────────────────────────────────────────────────────────────────
bootstrap: bootstrap-node bootstrap-go bootstrap-python bootstrap-dotnet bootstrap-jvm bootstrap-cli bootstrap-infra
	@echo "✅  All dependencies installed"

bootstrap-node:
	@echo "→ Installing Node MCP dependencies..."
	cd mcp-servers/node && npm install --no-audit --no-fund
	cd mcp-servers/sys && npm install --no-audit --no-fund
	cd mcp-servers/infra && npm install --no-audit --no-fund

bootstrap-go:
	@echo "→ Installing Go dependencies..."
	cd mcp-servers/go && go mod download

bootstrap-python:
	@echo "→ Installing Python dependencies..."
	cd mcp-servers/python && pip install --quiet -e ".[dev]"

bootstrap-dotnet:
	@echo "→ Restoring .NET packages..."
	cd mcp-servers/dotnet && dotnet restore

bootstrap-jvm:
	@echo "→ Resolving JVM dependencies..."
	cd mcp-servers/jvm && ./gradlew dependencies --quiet

bootstrap-cli:
	@echo "→ Installing CLI dependencies..."
	cd packages/cli && npm install --no-audit --no-fund

bootstrap-infra:
	@echo "→ Installing Infra dependencies..."
	cd mcp-servers/infra && npm install --no-audit --no-fund

# ─── Tests ────────────────────────────────────────────────────────────────────
test-all: test-node test-go test-python test-dotnet test-jvm test-sys test-cli
	@echo "✅  All tests complete"

test-node:
	cd mcp-servers/node && npm test

test-go:
	cd mcp-servers/go && go test ./... -race -v

test-python:
	cd mcp-servers/python && python -m pytest -v

test-dotnet:
	cd mcp-servers/dotnet && dotnet test --logger "console;verbosity=normal"

test-jvm:
	cd mcp-servers/jvm && ./gradlew test

test-sys:
	cd mcp-servers/sys && npm test

test-infra:
	cd mcp-servers/infra && npm test

test-cli:
	cd packages/cli && npm test

# ─── Lint ─────────────────────────────────────────────────────────────────────
lint:
	cd mcp-servers/node && npx tsc --noEmit
	cd mcp-servers/sys && npx tsc --noEmit
	cd mcp-servers/infra && npx tsc --noEmit
	cd mcp-servers/go && golangci-lint run ./...
	cd mcp-servers/python && ruff check .
	cd mcp-servers/dotnet && dotnet format --verify-no-changes

# ─── Build ────────────────────────────────────────────────────────────────────
build-node:
	cd mcp-servers/node && npm run build

build-sys:
	cd mcp-servers/sys && npm run build

build-infra:
	cd mcp-servers/infra && npm run build

build-go:
	cd mcp-servers/go && go build -o bin/agent-mcp-go ./...

build-python:
	cd mcp-servers/python && poetry build

build-dotnet:
	cd mcp-servers/dotnet && dotnet build -c Release

build-jvm:
	cd mcp-servers/jvm && ./gradlew jar

build-cli:
	cd packages/cli && npm run build

# ─── Package ──────────────────────────────────────────────────────────────────
package-all: build-node build-go build-python build-dotnet build-jvm
	@bash scripts/pack.sh
	@echo "✅  All packages built"

# ─── Docker ───────────────────────────────────────────────────────────────────
sandbox-up:
	docker compose up -d

sandbox-down:
	docker compose down

# ─── Clean ────────────────────────────────────────────────────────────────────
clean:
	rm -rf mcp-servers/node/dist mcp-servers/node/node_modules
	rm -rf mcp-servers/sys/dist  mcp-servers/sys/node_modules
	rm -rf mcp-servers/infra/dist mcp-servers/infra/node_modules
	rm -rf mcp-servers/go/bin
	rm -rf mcp-servers/python/dist mcp-servers/python/.venv
	rm -rf mcp-servers/dotnet/bin mcp-servers/dotnet/obj
	rm -rf mcp-servers/jvm/build
	rm -rf packages/cli/dist packages/cli/node_modules
	@echo "✅  Clean complete"
