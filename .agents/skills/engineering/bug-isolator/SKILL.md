---
name: bug-isolator
description: >-
  Use when a bug is reported or discovered. Uses MCP AST tools to locate the
  smallest possible reproduction case before any fix is attempted. Creates an
  isolated test on a dedicated branch that reproduces the bug in under 10
  lines. No fix is written until the reproduction is confirmed green-red
  (passes before the bug, fails at the bug). Prevents fixing the wrong thing.
---

# Bug Isolator

The worst bug fixes are written before the bug is understood. This skill
forces understanding first: a reproduction case that proves you have the right
bug before you write a single fix.

## Step 1: Understand the report

Gather from the user or issue tracker:
- **Observed behavior**: what actually happens
- **Expected behavior**: what should happen
- **Reproduction steps**: the exact sequence of actions
- **Environment**: OS, runtime version, relevant config

If any of these are missing, ask before proceeding.

## Step 2: Locate the blast radius via AST

Use MCP tools to find candidate locations:

**Go:**
```
tool: go_ast_inspect
params: { path: "<package>", mode: "call_graph", filter: "<relevant symbol>" }
```

**Python:**
```
tool: py_ast_tracer
params: { path: "<module>", extract: "call_sites", symbol: "<symbol>" }
```

**TypeScript/JavaScript:**
```
tool: ts_typecheck_stream
params: { files: ["<relevant files>"] }
```

Also search for related symbols:
- Find all call sites of the suspected function
- Find all places the suspected data structure is mutated

## Step 3: Create a `bug-repro/` branch

```bash
git checkout -b bug-repro/<issue-id>-<kebab-description>
```

## Step 4: Write the minimal reproduction test

Write a single test that:
1. Sets up the minimum state needed to trigger the bug
2. Calls the suspected code path
3. Asserts on the **wrong** behavior (this test should pass on the current
   broken code — it is documenting the bug)

The test must be ≤ 10 lines of implementation (excluding boilerplate/imports).
If you need more, you haven't found the minimal case yet.

Run the test. Confirm it passes (i.e., it reproduces the bug — the assertion
on wrong behavior is satisfied).

## Step 5: Invert the assertion

Now write the **same test** with the assertion inverted to the correct
behavior. This test should fail on the current broken code.

Run it. Confirm it is red.

You now have a confirmed reproduction: one test that passes (wrong behavior)
and one that fails (correct behavior). This is the bug.

## Step 6: Present the reproduction

Output a bug report:

```markdown
## Bug Isolation Report — <issue id>

**Reproduction test:** `<path to test>`
**Location:** `<file>:<line>` — `<function name>`
**Minimal reproduction:** <N lines of code>

**Root cause hypothesis:** <one paragraph — what the code is doing wrong>

**Confirmed:** Test passes on broken behavior ✅ | Fails on correct behavior ✅
```

Present this to the user and confirm the hypothesis before writing any fix.

## Step 7: Fix, then test-drive forward

Only after the root cause is confirmed:
1. Fix the minimal reproduction — make the inverted test green
2. Run the full test suite
3. If other tests break, surface them — they may be related bugs or incorrect
   existing tests
4. Merge `bug-repro/` into the feature branch and delete it

## Rules

- Do not write a fix until Step 5 is complete.
- The reproduction test is committed. It is permanent — it becomes the
  regression test that prevents this bug from returning.
- If you cannot reproduce the bug in a test, say so explicitly. Do not guess
  at a fix.
- If the `rabbit-hole-reverser` activates while fixing, defer to it.
