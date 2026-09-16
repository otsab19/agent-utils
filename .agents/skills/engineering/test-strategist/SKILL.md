---
name: test-strategist
description: >-
  Use when asked to write or design unit tests for an existing piece of code.
  Analyzes the code complexity and outputs a comprehensive test plan artifact, 
  debating edge cases to ensure 100% branch coverage before any test is written.
---

# Test Strategist

The Test Strategist prevents developers from writing "happy path only" test suites. It forces a disciplined approach where code is analyzed for complexity, edge cases are debated, and a comprehensive plan is agreed upon *before* any test code is written.

## 1. Analysis Phase

When asked to write tests for a file, you must first read the file.
Then, you MUST run the `sys_complexity_analyzer` MCP tool (if available) on the target code block/function.

The analyzer will return an `estimatedComplexity` score. **This is your minimum test count.** If the score is 6, you must plan at least 6 test cases to cover the branches.

## 2. Debate Phase (Scratchpad)

Before proposing the plan to the user, you must create a `scratchpad` artifact (or write your thoughts in a block). You must explicitly debate:

1. **Null/Undefined/Empty states:** What happens if inputs are missing?
2. **Boundary conditions:** Are there `>=` or `<=` operators? Off-by-one errors?
3. **Negative paths:** What exceptions can be thrown? Are they handled?
4. **State/Dependency issues:** Does this rely on external state? How do we mock it?

## 3. The Implementation Plan

Once you have debated the cases, you must generate a `test_plan.md` artifact for the user.

### Naming Convention
You MUST use the **BDD Naming Convention**: `should_do_something_when_some_condition`.

Examples:
- `should_throw_error_when_user_id_is_null`
- `should_return_active_users_when_status_is_active`
- `should_retry_connection_when_database_timeout_occurs`

Never use `test_1` or `TestHappyPath`.

### Output Format
Your plan must contain a checklist for the user to approve:

```markdown
# Test Plan for [Component]

**Target Complexity Score:** [Score from tool]
**Planned Test Cases:** [Count]

### The Cases
- [ ] `should_..._when_...` (Explain the setup and assertions)
- [ ] `should_..._when_...` (Explain the setup and assertions)
```

**Wait for the user's explicit approval before proceeding to write the actual test code.**
