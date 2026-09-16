---
name: legacy-cartographer
description: >-
  Use before refactoring or extending any undocumented, untested, or legacy
  module. Generates characterization tests that lock the observed behavior of
  the code as-is, using MCP AST tools to understand structure. No refactoring
  happens until the characterization tests are green. Prevents breaking
  undocumented behavior.
---

# Legacy Cartographer

Legacy code without tests is a minefield. The cartographer maps it before
anyone steps in. This skill creates a behavioral contract from the code's
actual output — not from what anyone *thinks* it does.

## Pre-condition

This skill must run before any modification to:
- Files with no associated test file
- Files that haven't been touched in 6+ months
- Any file the user describes as "legacy", "black box", or "don't touch"
- Any module flagged by `improve-codebase-architecture` as high-risk

## Step 1: AST scan

Use the appropriate MCP tool to understand the module's public surface:

**Go:**
```
tool: go_ast_inspect
params: { path: "<file or package path>", mode: "exports" }
```

**Python:**
```
tool: py_ast_tracer
params: { path: "<file path>", extract: "public_symbols" }
```

**TypeScript/JavaScript:** Use `ts_typecheck_stream` to extract the exported
type signature, then read the source directly.

Output a summary of:
- Exported functions/classes/methods
- Their parameter types and return types
- Any side effects visible in the AST (file I/O, network calls, DB queries)

## Step 2: Generate characterization tests

For each exported symbol, write a characterization test that:
1. Calls the symbol with realistic inputs (derived from the codebase — search
   for existing call sites with `grep_search`)
2. Asserts on the actual output (run it first, record what comes out)
3. Is named descriptively: `test_<symbol>_produces_<observable>_given_<input>`

**Critical:** Run the code to discover the actual output. Do NOT guess.
Characterization tests record truth, not intent.

Place tests in a `__characterization__/` or `characterization_test` directory
alongside the module, clearly marked:

```typescript
// CHARACTERIZATION TEST — DO NOT CHANGE unless the underlying behavior
// is intentionally being changed as part of a documented refactor.
// See: CONTEXT.md § <module name>
```

## Step 3: Establish the contract

Run all characterization tests. They must all pass on the unmodified code.
If any fail, you have a test bug — fix the test to match reality, not the
other way around.

Record the contract in `CONTEXT.md`:

```markdown
## Module Contract: <module name> — <YYYY-MM-DD>

**Public surface:** <list of exported symbols>
**Characterization tests:** `<path to tests>`
**Known side effects:** <list>
**Safe to change:** <which parts>
**Do not change without updating contract:** <which parts>
```

## Step 4: Hand off to implementation

Only after all characterization tests are green and the contract is written,
proceed with the refactor. The tests are your safety net — if any go red
during refactoring, stop and investigate before continuing.

## Rules

- Never skip the AST scan phase.
- Characterization tests must be committed before any implementation changes.
- If a characterization test reveals surprising behavior, surface it to the
  user before continuing — it may indicate a bug in production.
- After refactoring, if a characterization test changes from green to red,
  that is a **regression** unless the change was deliberate and documented.
