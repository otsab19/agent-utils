// agent-mcp-go — Go MCP Server
//
// Exposes Go-specific tooling over JSON-RPC 2.0 via stdio.
// Tools: go_ast_inspect, go_test_isolate, go_mod_graph
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/your-org/agent-utils/mcp-servers/go/tools"
)

// MCPRequest represents a JSON-RPC 2.0 request.
type MCPRequest struct {
	JSONRPC string                 `json:"jsonrpc"`
	ID      interface{}            `json:"id"`
	Method  string                 `json:"method"`
	Params  map[string]interface{} `json:"params,omitempty"`
}

// MCPResponse represents a JSON-RPC 2.0 response.
type MCPResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *MCPError   `json:"error,omitempty"`
}

// MCPError represents a JSON-RPC 2.0 error object.
type MCPError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// ToolHandler is a function that handles a tool call.
type ToolHandler func(params map[string]interface{}) (interface{}, error)

var toolRegistry = map[string]ToolHandler{
	"go_ast_inspect":  tools.ASTInspect,
	"go_test_isolate": tools.TestIsolate,
	"go_mod_graph":    tools.ModGraph,
}

func respond(id interface{}, result interface{}, err *MCPError) {
	resp := MCPResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
		Error:   err,
	}
	data, _ := json.Marshal(resp)
	fmt.Println(string(data))
}

func main() {
	log.SetOutput(os.Stderr)
	log.Printf("agent-mcp-go started (transport: stdio)")

	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}

		var req MCPRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			respond(nil, nil, &MCPError{Code: -32700, Message: "Parse error: " + err.Error()})
			continue
		}

		handler, ok := toolRegistry[req.Method]
		if !ok {
			respond(req.ID, nil, &MCPError{Code: -32601, Message: "Method not found: " + req.Method})
			continue
		}

		result, err := handler(req.Params)
		if err != nil {
			respond(req.ID, nil, &MCPError{Code: -32000, Message: err.Error()})
			continue
		}

		respond(req.ID, result, nil)
	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("stdin scanner error: %v", err)
	}
}
