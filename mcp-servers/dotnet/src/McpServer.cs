// agent-mcp-dotnet — .NET / C# MCP Server
//
// Exposes .NET-specific tooling over JSON-RPC 2.0 via stdio.
// Tools: dotnet_roslyn_analyze, dotnet_test_runner, dotnet_nuget_audit

using System.Text.Json;
using System.Text.Json.Serialization;

namespace AgentUtils.MCP;

record McpRequest(
    [property: JsonPropertyName("jsonrpc")] string Jsonrpc,
    [property: JsonPropertyName("id")] JsonElement? Id,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("params")] Dictionary<string, JsonElement>? Params
);

record McpResponse(
    [property: JsonPropertyName("jsonrpc")] string Jsonrpc,
    [property: JsonPropertyName("id")] JsonElement? Id,
    [property: JsonPropertyName("result")] object? Result = null,
    [property: JsonPropertyName("error")] McpError? Error = null
);

record McpError(
    [property: JsonPropertyName("code")] int Code,
    [property: JsonPropertyName("message")] string Message
);

class McpServer
{
    static readonly Dictionary<string, Func<Dictionary<string, JsonElement>?, Task<object?>>> ToolRegistry =
        new()
        {
            ["dotnet_roslyn_analyze"] = RoslynTools.Analyze,
            ["dotnet_test_runner"]    = TestRunnerTools.Run,
            ["dotnet_nuget_audit"]    = NuGetTools.Audit,
        };

    static readonly JsonSerializerOptions JsonOpts = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false,
    };

    static void Respond(JsonElement? id, object? result = null, McpError? error = null)
    {
        var response = new McpResponse("2.0", id, result, error);
        Console.WriteLine(JsonSerializer.Serialize(response, JsonOpts));
    }

    static async Task Main()
    {
        Console.Error.WriteLine("[agent-mcp-dotnet] started (transport: stdio)");

        string? line;
        while ((line = Console.ReadLine()) != null)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;

            McpRequest req;
            try
            {
                req = JsonSerializer.Deserialize<McpRequest>(trimmed, JsonOpts)
                    ?? throw new JsonException("Null deserialization result");
            }
            catch (Exception e)
            {
                Respond(null, error: new McpError(-32700, $"Parse error: {e.Message}"));
                continue;
            }

            if (!ToolRegistry.TryGetValue(req.Method, out var handler))
            {
                Respond(req.Id, error: new McpError(-32601, $"Method not found: {req.Method}"));
                continue;
            }

            try
            {
                var result = await handler(req.Params);
                Respond(req.Id, result: result);
            }
            catch (Exception e)
            {
                Respond(req.Id, error: new McpError(-32000, e.Message));
            }
        }
    }
}
