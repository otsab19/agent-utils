---
name: scope-guard
description: >-
  Use before starting any significant feature or architectural change.
  Conducts a structured Socratic interview to surface hidden assumptions,
  disambiguate requirements, and record every resolved decision in CONTEXT.md.
  Creates a recoverable git tag checkpoint before work begins. Prevents scope
  creep and "I thought you meant..." failures.
---

# Scope Guard

Scope Guard is a requirements firewall. Before any code is touched, it
exhausts the ambiguity in the task description and locks the scope with a
written contract and a git checkpoint.

## Phase 1: Interview

Ask the user questions one at a time, in dependency order (resolve upstream
decisions before downstream ones). Cover every branch of the design tree:

**Required question categories:**
1. **What does done look like?** — Define the observable success state in
   concrete, testable terms. No vague outcomes.
2. **What is explicitly out of scope?** — Name things adjacent to the task
   that will NOT be done. Get confirmation.
3. **What are the constraints?** — Performance budgets, compatibility
   requirements, deadlines, tech choices.
4. **What can break?** — Identify downstream dependents and consumers that
   must keep working.
5. **What is the rollback plan?** — How do we undo this if it goes wrong?

For each question, provide your recommended answer before asking. This
accelerates convergence.

Stop asking when you have a complete, unambiguous picture. Typically 5-10
questions. Never pad with unnecessary questions.

## Phase 2: Write to CONTEXT.md

After the interview, append a dated scope entry to `CONTEXT.md` (create it
at the repo root if it does not exist):

```markdown
## Scope: <task name> — <YYYY-MM-DD>

**Done when:** <observable success state>

**Out of scope:**
- <item>
- <item>

**Constraints:** <list>

**Rollback:** <plan>

**Decisions:**
- <decision>: <rationale>
- <decision>: <rationale>
```

## Phase 3: Git checkpoint

Create a recoverable tag using `sys_safe_exec` (if available) before any
code changes:

```bash
git tag scope/<YYYYMMDD>-<kebab-task-name>
```

This tag is the escape hatch. If the implementation goes wrong, `git reset
--hard <tag>` returns to exactly this point.

Announce the tag to the user: "Checkpoint created: `scope/<tag>`. You can
return here at any time with `git reset --hard scope/<tag>`."

## Phase 4: Hand off

Summarise the locked scope in 3-5 bullet points and ask the user to confirm
before any implementation begins. Only proceed when confirmed.

## Rules

- Never skip the interview phase, even for "obvious" tasks.
- Never start coding during the interview.
- Every decision recorded in CONTEXT.md must have a rationale.
- If requirements change mid-implementation, run Scope Guard again for the
  changed portion before continuing.
