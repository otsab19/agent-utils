// go_test_isolate — Executes targeted sub-tests with auto-attached -race flags.
package tools

import (
	"bytes"
	"fmt"
	"os/exec"
	"time"
)

// TestIsolateResult holds the output of a targeted test run.
type TestIsolateResult struct {
	TestName   string `json:"testName"`
	Passed     bool   `json:"passed"`
	Output     string `json:"output"`
	DurationMs int64  `json:"durationMs"`
}

// TestIsolate implements the go_test_isolate tool.
// params: { "packagePath": string, "testName": string, "subTest": string? }
func TestIsolate(params map[string]interface{}) (interface{}, error) {
	packagePath, ok := params["packagePath"].(string)
	if !ok || packagePath == "" {
		return nil, fmt.Errorf("required param: packagePath (string)")
	}
	testName, ok := params["testName"].(string)
	if !ok || testName == "" {
		return nil, fmt.Errorf("required param: testName (string)")
	}

	runPattern := testName
	if subTest, ok := params["subTest"].(string); ok && subTest != "" {
		runPattern = testName + "/" + subTest
	}

	args := []string{"test", "-run", runPattern, "-v", "-race", packagePath}
	cmd := exec.Command("go", args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	start := time.Now()
	// Hard timeout: 120s
	timer := time.AfterFunc(120*time.Second, func() {
		_ = cmd.Process.Kill()
	})
	err := cmd.Run()
	timer.Stop()
	durationMs := time.Since(start).Milliseconds()

	combined := stdout.String() + stderr.String()
	passed := err == nil

	return &TestIsolateResult{
		TestName:   runPattern,
		Passed:     passed,
		Output:     combined,
		DurationMs: durationMs,
	}, nil
}
