# .NET MCP Server (`AgentUtils.MCP`)

This server provides Roslyn-based code analysis and test integration for C#/F# projects.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-dotnet
make build-dotnet
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/dotnet
dotnet publish -c Release
./bin/Release/net8.0/publish/AgentUtils.MCP
```

## Tools

### `dotnet_roslyn_analyze`
Uses the Roslyn compiler API to perform deep static analysis of C# code.
- **Usage Context:** Used by architectural skills to understand class hierarchies and public interfaces.

### `dotnet_test_runner`
Executes specific xUnit/NUnit/MSTest tests with structured JSON output.
- **Usage Context:** Used by `bug-isolator` to verify minimal reproductions.

### `dotnet_nuget_audit`
Scans the project for known vulnerable packages or peer dependency conflicts.
- **Usage Context:** Used by `dependency-sleuth` to resolve NuGet package downgrade or conflict errors.
