---
name: cost-profiler
description: >-
  Use when implementing database operations, external API calls, or any loop
  over a collection. Scans modified files for N+1 query patterns, unbounded
  recursion, and billing-risk API usage via MCP AST tools. Flags bundle size
  regressions via js_bundle_inspect. Blocks completion until risks are
  acknowledged or mitigated.
trigger: model_decision
---

# Cost Profiler

Every loop over a collection that triggers an external call is a potential
production incident. This skill runs automatically when code touches
database ops, external APIs, or recursive algorithms.

## Trigger conditions

Activate this skill when any modified file contains:
- ORM query calls inside a loop (`for`, `forEach`, `map`, `each`)
- HTTP client calls (`fetch`, `axios`, `httpx`, `http.Get`) inside a loop
- Recursive functions without a clear bounded depth
- Any call to a third-party billing API (Stripe, Twilio, SendGrid, etc.)
- File changes to `*.ts`, `*.js`, `*.py`, `*.go`, `*.cs` touching `import`ed
  HTTP or DB libraries

## Step 1: AST scan for patterns

**TypeScript/JavaScript:**
```
tool: js_bundle_inspect
params: { path: "<build output or source>", check: "size_regression" }
```

Also search for N+1 patterns:
```
tool: node_runtime_eval
params: { code: "/* static analysis of import graph and call sites */" }
```

**Python:**
```
tool: py_ast_tracer
params: { path: "<file>", extract: "loop_call_patterns" }
```

**Go:**
```
tool: go_ast_inspect
params: { path: "<file>", mode: "loop_io_patterns" }
```

## Step 2: Classify findings

For each finding, classify by severity:

| Severity | Condition |
|---|---|
| 🔴 CRITICAL | DB/API call inside loop with unbounded iteration |
| 🟠 HIGH | DB/API call inside loop with bounded iteration (>100 possible) |
| 🟡 MEDIUM | Recursive function without memoization or depth guard |
| 🟢 INFO | Bundle size increased >10% from baseline |

## Step 3: Report

Output a cost profile report:

```
## Cost Profile Report — <file> — <timestamp>

🔴 CRITICAL: N+1 query detected
  Location: src/users/resolver.ts:42
  Pattern: `users.map(u => db.query(...))`
  Estimated calls: O(n) where n = result set size
  Risk: Database overload at scale; billing spike if metered

🟢 INFO: Bundle size
  Before: 142 KB
  After:  158 KB (+11%)
  Threshold: 10%
```

## Step 4: Gate

Do not mark the implementation as complete until:
- All 🔴 CRITICAL items are resolved (batched query, DataLoader, bulk fetch)
- All 🟠 HIGH items are either resolved or explicitly acknowledged by the
  user with a written justification in `CONTEXT.md`
- Bundle size regression is explained (new dependency, intentional feature)

For each CRITICAL finding, propose the idiomatic fix:
- **N+1 SQL**: batch with `WHERE id IN (?)` or DataLoader
- **N+1 HTTP**: batch endpoint or concurrent with `Promise.all` + rate limit
- **Unbounded recursion**: add depth parameter + guard clause

## Rules

- Do not skip this skill because "it's just a prototype".
- If the user overrides a CRITICAL finding, record the override in CONTEXT.md
  with a timestamp and the user's justification.
- Re-run this skill on every subsequent change to the same file.
