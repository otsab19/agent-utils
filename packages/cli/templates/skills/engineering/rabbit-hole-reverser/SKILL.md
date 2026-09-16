---
name: rabbit-hole-reverser
description: >-
  Automatically activated when the same test or build failure appears 3 or
  more times with an identical or near-identical error signature. Forces a
  hard stop, surfaces a diff of all changes since the failure began, and
  demands an alternate strategy before any more code is written. Prevents
  infinite retry loops.
trigger: model_decision
---

# Rabbit Hole Reverser

A rabbit hole is detected when the same failure appears 3+ times. At that
point, the current approach is **statistically invalidated**. More iterations
of the same fix will not work.

## Detection trigger

Count consecutive occurrences of errors with the same:
- Error message prefix (first 80 characters, ignoring line numbers)
- Failing test name or build target
- Exit code + stderr fingerprint

When count ≥ 3, this skill activates automatically.

## Step 1: Hard stop

Immediately output:

```
⛔ RABBIT HOLE DETECTED — Same failure seen 3 times.
Current approach is invalidated. No more code changes until a new strategy is agreed.
```

Do not attempt another fix.

## Step 2: Surface the change surface

Run via `sys_safe_exec` (or equivalent):

```bash
git diff HEAD~3 --stat
git diff HEAD~3
```

Output the diff in full. This shows exactly what was changed across the three
failed attempts.

## Step 3: Capture error fingerprint via MCP

Depending on the language, use the appropriate MCP tool to capture the
precise error:

- **Go**: `go_test_isolate` with the failing test name
- **Python**: `py_env_probe` with the relevant module
- **Node/TS**: `node_runtime_eval` or `ts_typecheck_stream`
- **Fallback**: re-run the failing command and capture stderr

Present the exact error, not a paraphrase.

## Step 4: Propose alternate strategies

Propose exactly **3 different architectural approaches** to solve the
underlying problem. Each must be genuinely different — not variations on the
same failed idea. For each:
- Name it
- Explain the mechanism in 2 sentences
- State what assumption it makes that the current approach did not

## Step 5: Request strategy selection

Ask the user to select one of the 3 strategies. Do not proceed until a
strategy is chosen.

Once chosen:
1. Reset to the last clean state: `git reset --hard HEAD~3` (confirm with
   user first)
2. Create a scope-guard checkpoint for the new strategy
3. Begin fresh with the selected approach

## Rules

- The reverser must activate even if you believe you have the fix.
- "Almost there" is not a valid reason to skip the reverser.
- After a reset, the failure count resets to 0.
- If the same failure appears 3 more times after a strategy change, repeat
  this skill from Step 1.
