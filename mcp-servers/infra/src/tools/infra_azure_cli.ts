import { execFileSync } from 'node:child_process';

const ALLOWED_AZURE_COMMANDS = ['show', 'list'];

export const infraAzureCli = {
  name: 'infra_azure_cli',
  description: 'Executes an az CLI command with read-only guardrails. Blocks state-mutating operations.',
  inputSchema: {
    type: 'object',
    properties: {
      group: { type: 'string', description: 'The Azure command group (e.g., "vm", "webapp")' },
      operation: { type: 'string', description: 'The Azure operation (e.g., "list", "show")' },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional arguments (e.g., ["--resource-group", "my-rg"])'
      }
    },
    required: ['group', 'operation']
  },
  async handler(params: { group: string; operation: string; args?: string[] }) {
    const op = params.operation.toLowerCase();
    
    // Check if the operation is in the allowed list
    if (!ALLOWED_AZURE_COMMANDS.includes(op)) {
      return { 
        error: `Guardrail triggered: Azure operation '${params.operation}' is blocked. Only read-only operations (${ALLOWED_AZURE_COMMANDS.join(', ')}) are allowed.`,
        isError: true 
      };
    }

    const execArgs = [params.group, params.operation, ...(params.args || [])];

    try {
        const output = execFileSync('az', execArgs, { encoding: 'utf8', timeout: 30000 });
        return { result: output };
    } catch (e: any) {
        return { error: e.stderr || e.message, isError: true };
    }
  }
};
