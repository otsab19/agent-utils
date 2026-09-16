---
name: tdd-loop
description: >-
  Use when writing new functionality with tests. Enforces strict red-green-
  refactor with explicit seam agreement before the first test is written.
  Gates the green phase with a live ts_typecheck_stream call (for TypeScript
  projects) or language-equivalent type/lint check. Prevents the "tests pass,
  types broken" failure mode.
---

# TDD Loop

The TDD loop produces tests that are worth keeping. This skill makes the loop
disciplined: seams are agreed before a single test is written, and green means
green everywhere — tests and types.

## Pre-flight: agree the seams

A **seam** is the public boundary where you observe behavior without reaching
inside the implementation. Before writing any test:

1. List every seam under test as a bullet point.
2. Present the list to the user: "I propose to test at these seams: ..."
3. Wait for explicit confirmation. No test is written at an unconfirmed seam.

Example seams:
- `UserService.createUser(dto)` — the public method, not the DB call inside
- `POST /api/users` — the HTTP endpoint, not the service layer
- The exported `parseConfig()` function — not internal `_validate()`

If the shape of the interface is unclear, use `scope-guard` first.

## The loop

Execute for each behavior to implement:

### 🔴 Red: write the failing test

Write exactly one test. The test must:
- Be named as a specification: `"createUser creates a user with hashed password"`
- Test only the agreed seam
- Fail with a meaningful assertion error (not compile/import error)
- Not test implementation details (no mocking internals)

Run the test. Confirm it is red. If it passes immediately, the test is wrong.

### 🟢 Green: write the minimal implementation

Write the **minimum** code to make the test pass. This is not the time for:
- Abstracting for future use cases
- Refactoring existing code
- Adding error handling beyond what the test requires

Run the test. Confirm it is green.

### 🔷 Type gate (TypeScript projects only)

Before refactoring, invoke `ts_typecheck_stream` on the modified files:

```
tool: ts_typecheck_stream
params: { files: ["<modified files>"], strict: true }
```

If type errors exist: fix them now, before refactoring. A green test with red
types is not green.

### 🔵 Refactor: improve without changing behavior

Clean up the implementation:
- Extract named functions for clarity
- Remove duplication
- Apply project conventions from `CONTEXT.md`

After each refactor step, run the tests. If any go red, revert the last
refactor step.

### Commit

```
git commit -m "test: <behavior name>"
git commit -m "feat: <implementation summary>"
```

Then begin the next behavior.

## Rules

- Never write two tests before implementing the first.
- Never implement more than what the current test requires.
- If you realize mid-loop that a seam was wrong, stop. Re-agree the seam.
  Do not write workaround code to patch a bad seam.
- If tests pass but the feature doesn't work end-to-end, the seam is wrong.
  Restart from seam agreement.
- Mocking: mock at infrastructure boundaries only (HTTP, DB, filesystem).
  Never mock the thing you're testing. See project CONTEXT.md for conventions.
