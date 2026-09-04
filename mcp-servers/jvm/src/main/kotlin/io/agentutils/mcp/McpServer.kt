/**
 * agent-mcp-jvm — Java/JVM MCP Server
 *
 * Exposes JVM-specific tooling over JSON-RPC 2.0 via stdio.
 * Tools: jvm_gradle_diagnose, jvm_stacktrace_unpack, jvm_bytecode_signature
 */

package io.agentutils.mcp

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.BufferedReader
import java.io.InputStreamReader

data class McpRequest(
    val jsonrpc: String = "2.0",
    val id: Any? = null,
    val method: String = "",
    val params: Map<String, Any?>? = null
)

data class McpResponse(
    val jsonrpc: String = "2.0",
    val id: Any? = null,
    val result: Any? = null,
    val error: McpError? = null
)

data class McpError(val code: Int, val message: String)

typealias ToolHandler = (Map<String, Any?>) -> Any

val toolRegistry: Map<String, ToolHandler> = mapOf(
    "jvm_gradle_diagnose"     to ::gradleDiagnose,
    "jvm_stacktrace_unpack"   to ::stacktraceUnpack,
    "jvm_bytecode_signature"  to ::bytecodeSignature
)

val gson = Gson()

fun respond(id: Any?, result: Any? = null, error: McpError? = null) {
    val response = McpResponse(id = id, result = result, error = error)
    println(gson.toJson(response))
    System.out.flush()
}

fun main() {
    System.err.println("[agent-mcp-jvm] started (transport: stdio)")
    val reader = BufferedReader(InputStreamReader(System.`in`))
    val mapType = object : TypeToken<Map<String, Any?>>() {}.type

    for (line in reader.lines()) {
        val trimmed = line.trim()
        if (trimmed.isEmpty()) continue

        val req: McpRequest = try {
            val raw: Map<String, Any?> = gson.fromJson(trimmed, mapType)
            McpRequest(
                id = raw["id"],
                method = raw["method"] as? String ?: "",
                params = raw["params"] as? Map<String, Any?>
            )
        } catch (e: Exception) {
            respond(null, error = McpError(-32700, "Parse error: ${e.message}"))
            continue
        }

        val handler = toolRegistry[req.method]
        if (handler == null) {
            respond(req.id, error = McpError(-32601, "Method not found: ${req.method}"))
            continue
        }

        try {
            val result = handler(req.params ?: emptyMap())
            respond(req.id, result = result)
        } catch (e: Exception) {
            respond(req.id, error = McpError(-32000, e.message ?: "Unknown error"))
        }
    }
}
