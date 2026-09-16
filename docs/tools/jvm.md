# JVM MCP Server (`mcp-java`)

This server provides bytecode analysis and build diagnostics for Java/Kotlin projects using Gradle or Maven.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-jvm
make build-jvm
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/jvm
./gradlew build
java -jar build/libs/mcp-java.jar
```

## Tools

### `jvm_gradle_diagnose`
Runs Gradle tasks with diagnostic flags (e.g., `--scan`, `--info`) and parses the structured output.
- **Usage Context:** Used by `dependency-sleuth` to resolve Gradle version conflicts.

### `jvm_stacktrace_unpack`
Parses raw Java stack traces and maps them to exact lines in the source code.
- **Usage Context:** Used by `rabbit-hole-reverser` to fingerprint exceptions.

### `jvm_bytecode_signature`
Inspects compiled `.class` files to determine true public interfaces without requiring source code access.
- **Usage Context:** Used by `legacy-cartographer` when dealing with compiled third-party dependencies.
