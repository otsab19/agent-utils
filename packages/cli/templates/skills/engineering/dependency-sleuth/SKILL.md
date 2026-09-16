---
name: dependency-sleuth
description: >-
  Use when a package install, dependency resolution, or peer conflict fails.
  Uses the live MCP node_runtime_eval tool to query npm/PyPI/Go module
  registries for compatible versions, parses the conflict graph, and proposes
  a pinned resolution with rationale. Prevents hours of manual version
  archaeology.
---

# Dependency Sleuth

Dependency conflicts are graph problems. This skill navigates the graph
systematically instead of guessing version pins.

## Step 1: Capture the error

Run the failing install command and capture the full error output. Do not
guess — read the actual error. Common patterns to identify:

- **npm/pnpm**: `ERESOLVE` peer conflict, incompatible engine, `ENOTFOUND`
- **pip**: `ResolutionImpossible`, `RequirementsConflict`
- **Go**: `incompatible`, `ambiguous import`, `go.sum mismatch`
- **Gradle/Maven**: `Could not resolve`, `version conflict`

## Step 2: Build the conflict graph

Parse the error to identify:
- The **root package** being installed
- The **conflicting packages** and their version requirements
- The **transitive chain** that created the conflict

Draw this as a simple dependency tree in a code block:

```
root-package@X.Y
  ├── conflicting-dep@^A.B (requires peer: shared-dep@^1.0)
  └── other-dep@^C.D       (requires peer: shared-dep@^2.0)
                                              ^^^^ CONFLICT
```

## Step 3: Query the live registry via MCP

Use `node_runtime_eval` to query the registry for real data:

```javascript
// Query npm registry
const res = await fetch('https://registry.npmjs.org/<package-name>');
const data = await res.json();
// Check versions, peerDependencies, engines
```

For PyPI:
```javascript
const res = await fetch('https://pypi.org/pypi/<package>/json');
```

For Go modules, use `sys_safe_exec`:
```bash
go list -m -json all | jq 'select(.Path == "<module>")'
```

## Step 4: Find the resolution

Identify the version range intersection that satisfies all constraints. If
one exists, propose it. If it doesn't exist, identify the minimum upgrade
required.

## Step 5: Propose a pinned resolution

Output a concrete, copy-paste fix:

**For npm:**
```json
{
  "overrides": {
    "<conflicting-package>": "<resolved-version>"
  }
}
```

**For pip:**
```
<package>==<resolved-version>  # pins to resolve conflict with <other-package>
```

**For Go:**
```
go get <module>@<resolved-version>
```

Always include:
- Why this version was chosen
- What it breaks (if anything) — check changelogs
- Whether it is a temporary pin or a permanent fix

## Step 6: Verify

After applying the fix, re-run the install command. If it fails again, return
to Step 1 with the new error. If the rabbit-hole-reverser activates (same
error 3 times), defer to it.

## Rules

- Never pin to a version without querying the actual registry data.
- Always explain the conflict graph — don't just output a fix.
- Prefer the narrowest override (pin only what's needed) over widening
  all version ranges.
- Flag any pinned version that is older than 6 months without security patches.
