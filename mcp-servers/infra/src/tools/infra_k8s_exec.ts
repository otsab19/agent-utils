import { execSync } from 'node:child_process';

const ALLOWED_K8S_COMMANDS = ['get', 'describe', 'logs', 'top', 'version', 'api-resources', 'api-versions', 'cluster-info'];

export const infraK8sExec = {
  name: 'infra_k8s_exec',
  description: 'Executes a kubectl command with read-only guardrails. Blocks state-mutating operations like apply, delete, edit, or scale.',
  inputSchema: {
    type: 'object',
    properties: {
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Arguments to pass to kubectl (e.g., ["get", "pods", "-n", "kube-system"])'
      }
    },
    required: ['args']
  },
  async handler(params: { args: string[] }) {
    if (params.args.length === 0) {
        return { error: 'No arguments provided', isError: true };
    }

    const commandStr = params.args[0].toLowerCase();
    
    // Check if the command is in the allowed list
    if (!ALLOWED_K8S_COMMANDS.includes(commandStr)) {
      return { 
        error: `Guardrail triggered: kubectl '${commandStr}' is blocked. Only read-only commands (${ALLOWED_K8S_COMMANDS.join(', ')}) are allowed.`,
        isError: true 
      };
    }

    // Double check for sneaky injection or pipes (though execSync doesn't evaluate pipes if we don't use shell: true, but we are constructing a string here, which is risky if we don't quote properly. Better to pass array to spawn, but execSync string is simpler if we escape, or use execFileSync).
    
    try {
        // Use execFileSync to avoid shell injection
        const { execFileSync } = require('node:child_process');
        const output = execFileSync('kubectl', params.args, { encoding: 'utf8', timeout: 30000 });
        return { result: output };
    } catch (e: any) {
        return { error: e.stderr || e.message, isError: true };
    }
  }
};
