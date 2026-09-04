// .NET MCP Tool Implementations

using System.Diagnostics;
using System.Text.Json;

namespace AgentUtils.MCP;

static class ProcessHelper
{
    public static async Task<(string Stdout, string Stderr, int ExitCode)> RunAsync(
        string command, string args, string? workDir = null, int timeoutMs = 120_000)
    {
        var psi = new ProcessStartInfo(command, args)
        {
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            WorkingDirectory = workDir ?? Directory.GetCurrentDirectory(),
        };

        using var proc = Process.Start(psi) ?? throw new Exception($"Failed to start: {command}");
        var stdoutTask = proc.StandardOutput.ReadToEndAsync();
        var stderrTask = proc.StandardError.ReadToEndAsync();

        var completed = await Task.WhenAll(
            proc.WaitForExitAsync(CancellationToken.None),
            stdoutTask,
            stderrTask
        ).WaitAsync(TimeSpan.FromMilliseconds(timeoutMs));

        return (await stdoutTask, await stderrTask, proc.ExitCode);
    }
}

static class RoslynTools
{
    /// <summary>
    /// dotnet_roslyn_analyze — Invokes Roslyn to fetch compiler diagnostics.
    /// params: { "projectPath": string, "severity": "error"|"warning"|"all"? }
    /// </summary>
    public static async Task<object?> Analyze(Dictionary<string, JsonElement>? @params)
    {
        var projectPath = @params?.GetValueOrDefault("projectPath").GetString()
            ?? throw new ArgumentException("Required param: projectPath");

        var (stdout, stderr, exitCode) = await ProcessHelper.RunAsync(
            "dotnet", $"build \"{projectPath}\" --no-restore -v detailed",
            workDir: Path.GetDirectoryName(projectPath)
        );

        var combined = stdout + stderr;
        var errorLines = combined.Split('\n')
            .Where(l => l.Contains("error") || l.Contains("warning"))
            .Select(l => l.Trim())
            .Where(l => l.Length > 0)
            .Take(50)
            .ToList();

        return new { projectPath, exitCode, diagnostics = errorLines, rawOutput = combined.Take(4000) };
    }
}

static class TestRunnerTools
{
    /// <summary>
    /// dotnet_test_runner — Wraps dotnet test and returns parsed failure diagnostics.
    /// params: { "projectPath": string, "filter": string? }
    /// </summary>
    public static async Task<object?> Run(Dictionary<string, JsonElement>? @params)
    {
        var projectPath = @params?.GetValueOrDefault("projectPath").GetString()
            ?? throw new ArgumentException("Required param: projectPath");

        var filter = @params?.GetValueOrDefault("filter").GetString() ?? "";
        var filterArg = string.IsNullOrEmpty(filter) ? "" : $"--filter \"{filter}\"";

        var (stdout, stderr, exitCode) = await ProcessHelper.RunAsync(
            "dotnet", $"test \"{projectPath}\" {filterArg} --logger \"console;verbosity=normal\" --no-restore",
            workDir: Path.GetDirectoryName(projectPath)
        );

        var combined = stdout + stderr;
        var failures = combined.Split('\n')
            .Where(l => l.Contains("Failed") || l.Contains("Error") || l.Contains("at "))
            .Select(l => l.Trim())
            .Take(30)
            .ToList();

        return new
        {
            projectPath,
            filter,
            passed = exitCode == 0,
            exitCode,
            failures,
            rawOutput = combined.Take(4000),
        };
    }
}

static class NuGetTools
{
    /// <summary>
    /// dotnet_nuget_audit — Analyzes .csproj PackageReferences for vulnerabilities and breaking changes.
    /// params: { "projectPath": string }
    /// </summary>
    public static async Task<object?> Audit(Dictionary<string, JsonElement>? @params)
    {
        var projectPath = @params?.GetValueOrDefault("projectPath").GetString()
            ?? throw new ArgumentException("Required param: projectPath");

        var (stdout, stderr, exitCode) = await ProcessHelper.RunAsync(
            "dotnet", $"list \"{projectPath}\" package --vulnerable --include-transitive",
            workDir: Path.GetDirectoryName(projectPath)
        );

        var combined = stdout + stderr;
        var vulnerabilities = combined.Split('\n')
            .Where(l => l.Contains("Critical") || l.Contains("High") || l.Contains("Moderate"))
            .Select(l => l.Trim())
            .Take(20)
            .ToList();

        return new
        {
            projectPath,
            exitCode,
            vulnerabilities,
            hasVulnerabilities = vulnerabilities.Count > 0,
            rawOutput = combined.Take(4000),
        };
    }
}
