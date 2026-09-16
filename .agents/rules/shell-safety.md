---
trigger: always_on
---

# Shell Safety Rules

These rules apply to every shell command invoked by the agent, without
exception. They prevent terminal hangs, accidental data destruction, and
interactive prompts that block execution.

## 1. No interactive prompts

Every CLI invocation MUST include the appropriate non-interactive flag:

```bash
# Package managers
npm install --no-audit --no-fund --yes
pip install --quiet --no-input
apt-get install -y -qq <pkg>
brew install --quiet <pkg>
GIT_TERMINAL_PROMPT=0 git clone <url>

# Framework CLIs
dotnet new <template> --no-restore
npx create-<app> --yes

# Database
psql -c "<query>"  # never interactive psql shell
```

## 2. Quote safety — heredocs only

When writing multi-line content to files, use single-quoted heredocs
exclusively. Never use echo with escaped quotes.

```bash
# ✅ REQUIRED
cat << 'EOF' > path/to/file.txt
content with "quotes" and $variables preserved literally
EOF

# ❌ FORBIDDEN
echo "content with \"escaped quotes\""  > path/to/file.txt
echo "content with $VARIABLE"           > path/to/file.txt
```

## 3. Timeout enforcement

Wrap all potentially blocking commands:

```bash
timeout 120s <command> || {
  echo "TIMEOUT: Command exceeded 120s — aborting"
  exit 1
}
```

Long-running build/test commands get 300s:
```bash
timeout 300s make test-all || { echo "TIMEOUT after 300s"; exit 1; }
```

## 4. Destructive command filter

The following are BLOCKED without explicit engineer authorization in this
session:

- `git push --force` / `git push -f`
- `rm -rf /` or any path that is `/` or `~` without a specific subdirectory
- `DROP TABLE` / `DROP DATABASE` / `TRUNCATE` without prior backup verification
- `kubectl delete namespace` without dry-run confirmation
- `terraform destroy` without plan review

If the user requests one of these, respond:
"This command requires explicit authorization. Please confirm you want to run:
`<command>` — this cannot be undone."

## 5. Path safety

Before any destructive file operation (`rm`, `mv`, `cp` with overwrite):
- Print the absolute resolved path
- Confirm it is within the expected working directory
- Use `--no-clobber` or `-i` flags where available
