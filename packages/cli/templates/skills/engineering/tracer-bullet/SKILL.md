---
name: tracer-bullet
description: >-
  Use when building a new feature or integration. Guides the agent to cut
  thin, end-to-end vertical slices (database → logic → API → UI) one at a
  time, validating each slice with a passing test and a live type-check via
  the ts_typecheck_stream MCP tool before moving on. Prevents layer-by-layer
  builds that integrate badly.
---

# Tracer Bullet

A tracer bullet is the thinnest possible path through the full stack that
proves the feature works end-to-end. It is not a prototype. It becomes the
permanent foundation you build on.

## Pre-flight: agree the slices

Before writing a single line of code, produce and confirm with the user a
**slice list** — an ordered list of named vertical cuts, each touching every
layer the feature needs. Each slice must be independently testable and
deployable. Get explicit sign-off.

Example slice list for "user can check out with Stripe":
1. Create payment_intent via Stripe API, store id in DB
2. Confirm intent on webhook, flip order status
3. Return order confirmation to client
4. Display confirmation on UI

Do not proceed until the list is approved.

## The loop (one slice at a time)

For each slice, execute this loop in strict order:

### 1. Write the test first (Red)
- Write a single integration test at the public seam of this slice.
- The test must fail with a meaningful assertion error — not a compile error.
- Confirm the test is red before writing implementation.

### 2. Implement the thinnest passing code (Green)
- Write only what makes the test pass. No speculative code.
- No refactoring. No "while I'm here" changes.

### 3. Type-check via MCP (Gate)
If the project has TypeScript files, invoke `ts_typecheck_stream` on the
modified files before declaring this slice complete:

```
tool: ts_typecheck_stream
params: { files: ["<modified files>"], strict: true }
```

If type errors surface: fix them in this step. Do not move to the next slice
with outstanding type errors.

### 4. Commit (Checkpoint)
Commit with message: `feat(<slice-name>): tracer bullet — <one line summary>`

Then move to the next slice.

## Rules

- Never work on two slices simultaneously.
- Never skip the type-check gate, even if tests are green.
- If a slice reveals that a prior slice was wrong, revert to that slice, fix
  it, and re-run the loop forward. Do not patch forward.
- A slice is not done until it has: a green test, zero type errors, and a
  commit.

## Completion

All slices are done when every item on the approved slice list has a green
test, zero type errors, and a commit. At that point, request a code review
using the `code-review` skill if it is available.
