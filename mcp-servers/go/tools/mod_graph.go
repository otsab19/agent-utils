// go_mod_graph — Resolves indirect module conflicts and returns minimum
// required replacements for go.mod.
package tools

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// ModGraphResult holds the dependency resolution output.
type ModGraphResult struct {
	Conflicts    []ModConflict `json:"conflicts"`
	Replacements []string      `json:"suggestedReplacements"`
	RawGraph     string        `json:"rawGraph"`
}

// ModConflict represents a detected module version conflict.
type ModConflict struct {
	Module   string `json:"module"`
	Required string `json:"required"`
	Selected string `json:"selected"`
}

// ModGraph implements the go_mod_graph tool.
// params: { "repoPath": string }
func ModGraph(params map[string]interface{}) (interface{}, error) {
	repoPath, ok := params["repoPath"].(string)
	if !ok || repoPath == "" {
		return nil, fmt.Errorf("required param: repoPath (string)")
	}

	// Run go mod graph
	cmd := exec.Command("go", "mod", "graph")
	cmd.Dir = repoPath
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("go mod graph failed: %s", stderr.String())
	}

	rawGraph := stdout.String()

	// Run go mod verify to detect issues
	verifyCmd := exec.Command("go", "mod", "verify")
	verifyCmd.Dir = repoPath
	var verifyOut bytes.Buffer
	verifyCmd.Stdout = &verifyOut
	verifyCmd.Stderr = &verifyOut
	_ = verifyCmd.Run()

	// Simple conflict detection: look for duplicate module entries with different versions
	lines := strings.Split(rawGraph, "\n")
	seen := map[string]string{}
	conflicts := []ModConflict{}

	for _, line := range lines {
		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}
		dep := parts[1]
		atIdx := strings.LastIndex(dep, "@")
		if atIdx < 0 {
			continue
		}
		module := dep[:atIdx]
		version := dep[atIdx+1:]

		if existingVer, exists := seen[module]; exists && existingVer != version {
			conflicts = append(conflicts, ModConflict{
				Module:   module,
				Required: version,
				Selected: existingVer,
			})
		} else {
			seen[module] = version
		}
	}

	replacements := make([]string, 0, len(conflicts))
	for _, c := range conflicts {
		replacements = append(replacements,
			fmt.Sprintf("replace %s => %s %s", c.Module, c.Module, c.Selected))
	}

	return &ModGraphResult{
		Conflicts:    conflicts,
		Replacements: replacements,
		RawGraph:     rawGraph,
	}, nil
}
