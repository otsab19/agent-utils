/**
 * JVM MCP Tool Implementations
 */

package io.agentutils.mcp

import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

fun runCommand(cmd: List<String>, workDir: String? = null, timeoutSec: Long = 120): Pair<String, String> {
    val pb = ProcessBuilder(cmd).apply {
        workDir?.let { directory(java.io.File(it)) }
        environment()["JAVA_OPTS"] = "-Xmx512m"
    }
    val proc = pb.start()
    val stdout = proc.inputStream.bufferedReader().readText()
    val stderr = proc.errorStream.bufferedReader().readText()
    proc.waitFor(timeoutSec, TimeUnit.SECONDS)
    return Pair(stdout, stderr)
}

/**
 * jvm_gradle_diagnose — Runs Gradle dependency verification with --stacktrace --info.
 * params: { repoPath: String, task: String? }
 */
fun gradleDiagnose(params: Map<String, Any?>): Map<String, Any?> {
    val repoPath = params["repoPath"] as? String
        ?: throw IllegalArgumentException("Required param: repoPath")
    val task = params["task"] as? String ?: "dependencies"

    val (stdout, stderr) = runCommand(
        listOf("./gradlew", task, "--stacktrace", "--info", "--no-daemon"),
        workDir = repoPath
    )

    val errorLines = (stdout + stderr).lines().filter {
        it.contains("FAILED") || it.contains("Could not resolve") || it.contains("Exception")
    }

    return mapOf(
        "task" to task,
        "repoPath" to repoPath,
        "succeeded" to !stdout.contains("BUILD FAILED"),
        "errors" to errorLines,
        "rawOutput" to (stdout + stderr).take(8000)
    )
}

/**
 * jvm_stacktrace_unpack — Decodes nested Caused by: chains and maps to project file paths.
 * params: { stacktrace: String, projectRoot: String? }
 */
fun stacktraceUnpack(params: Map<String, Any?>): Map<String, Any?> {
    val stacktrace = params["stacktrace"] as? String
        ?: throw IllegalArgumentException("Required param: stacktrace")
    val projectRoot = params["projectRoot"] as? String ?: "."

    val lines = stacktrace.lines()
    val causedByChain = mutableListOf<Map<String, Any?>>()
    val atPattern = Regex("""^\s+at (.+)\((.+):(\d+)\)""")
    val causedByPattern = Regex("""^Caused by: (.+)""")

    var currentException: String? = null
    val currentFrames = mutableListOf<Map<String, String>>()

    for (line in lines) {
        val causedMatch = causedByPattern.find(line)
        if (causedMatch != null) {
            if (currentException != null) {
                causedByChain.add(mapOf("exception" to currentException!!, "frames" to currentFrames.toList()))
                currentFrames.clear()
            }
            currentException = causedMatch.groupValues[1]
            continue
        }

        val atMatch = atPattern.find(line)
        if (atMatch != null) {
            currentFrames.add(mapOf(
                "method" to atMatch.groupValues[1],
                "file" to atMatch.groupValues[2],
                "line" to atMatch.groupValues[3]
            ))
        }
    }

    if (currentException != null) {
        causedByChain.add(mapOf("exception" to currentException!!, "frames" to currentFrames.toList()))
    }

    return mapOf(
        "rootCause" to causedByChain.lastOrNull()?.get("exception"),
        "chain" to causedByChain,
        "projectRoot" to projectRoot
    )
}

/**
 * jvm_bytecode_signature — Inspects compiled .class files via javap.
 * params: { classFilePath: String }
 */
fun bytecodeSignature(params: Map<String, Any?>): Map<String, Any?> {
    val classFilePath = params["classFilePath"] as? String
        ?: throw IllegalArgumentException("Required param: classFilePath")

    val (stdout, stderr) = runCommand(
        listOf("javap", "-p", "-s", classFilePath)
    )

    val methods = stdout.lines().filter { it.trim().startsWith("public") || it.trim().startsWith("private") }

    return mapOf(
        "classFilePath" to classFilePath,
        "methods" to methods,
        "rawOutput" to stdout,
        "error" to stderr.takeIf { it.isNotBlank() }
    )
}
