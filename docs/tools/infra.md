# Infrastructure MCP Server (`@otsab190/mcp-infra`)

This server provides safe, guardrailed wrappers around local infrastructure and cloud CLIs. Rather than building complex native integrations with specific SDKs (which require extensive auth management), this server wraps the standard local CLIs (`kubectl`, `aws`, `az`, `psql`, etc.) while enforcing strict read-only policies.

## Installation

**Global Install (via AgentUtils)**
```bash
make bootstrap-infra
make build-infra
# Handled automatically by scripts/install.sh
```

**Manual Usage**
```bash
cd mcp-servers/infra
npm install
npm run build
node dist/server.js
```

> **Note on Authentication:** Because these tools wrap local CLIs, they rely entirely on the environment of the user running the agent (e.g., your active `~/.aws/credentials`, `~/.kube/config`, or `az login` state). Ensure you are authenticated in your terminal before using these tools.

## Tools

### `infra_db_query`
Executes SQL queries via `psql` or `mysql` CLI tools.
- **Guardrails:** Parses the SQL string and blocks `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, and `TRUNCATE` unless explicitly overridden.
- **Parameters:**
  - `connectionString` (string): Connection URI (e.g., `postgres://...`, `mysql://...`).
  - `query` (string): The SQL query to execute.
  - `allowMutation` (boolean, optional): Bypass read-only guardrails.

### `infra_k8s_exec`
Safe wrapper for `kubectl`.
- **Guardrails:** Only allows safe reads like `get`, `describe`, `logs`, `top`. Blocks `apply`, `delete`, `edit`.
- **Parameters:**
  - `args` (array of strings): Arguments to pass to `kubectl`.

### `infra_aws_cli`
Safe wrapper for the `aws` CLI.
- **Guardrails:** Blocks mutating prefixes like `delete-`, `put-`, `update-`, `create-`.
- **Parameters:**
  - `service` (string): The AWS service (e.g., `s3`).
  - `operation` (string): The operation (e.g., `ls`).
  - `args` (array of strings, optional): Additional arguments.

### `infra_azure_cli`
Safe wrapper for the `az` CLI.
- **Guardrails:** Only allows `show` and `list` operations.
- **Parameters:**
  - `group` (string): The Azure command group (e.g., `vm`).
  - `operation` (string): The operation (e.g., `list`).
  - `args` (array of strings, optional): Additional arguments.

### `infra_mq_inspect`
Inspects Kafka (`kafka-topics.sh`, `kafka-console-consumer.sh`) and RabbitMQ (`rabbitmqadmin`).
- **Guardrails:** Restricted to listing topics/queues and consuming a max of 10 messages. Blocks all creation/deletion operations.
- **Parameters:**
  - `system` (string): `kafka` or `rabbitmq`.
  - `operation` (string): `list` or `consume`.
  - `target` (string, optional): Topic or queue name (required for consume).
  - `connectionArgs` (array of strings, optional): Connection arguments.
