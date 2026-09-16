import { execFileSync } from 'node:child_process';

const BLOCKED_AWS_PREFIXES = ['delete', 'put', 'update', 'create', 'terminate', 'stop', 'start', 'attach', 'detach', 'modify'];

export const infraAwsCli = {
  name: 'infra_aws_cli',
  description: 'Executes an aws CLI command with read-only guardrails. Blocks state-mutating operations.',
  inputSchema: {
    type: 'object',
    properties: {
      service: { type: 'string', description: 'The AWS service (e.g., "s3", "ec2")' },
      operation: { type: 'string', description: 'The AWS operation (e.g., "ls", "describe-instances")' },
      args: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional arguments (e.g., ["--region", "us-east-1"])'
      }
    },
    required: ['service', 'operation']
  },
  async handler(params: { service: string; operation: string; args?: string[] }) {
    const op = params.operation.toLowerCase();
    
    // Check if the operation starts with any blocked prefix
    for (const prefix of BLOCKED_AWS_PREFIXES) {
      if (op.startsWith(prefix)) {
        return { 
          error: `Guardrail triggered: AWS operation '${params.operation}' is blocked because it starts with '${prefix}'. Only read-only operations are allowed.`,
          isError: true 
        };
      }
    }

    const execArgs = [params.service, params.operation, ...(params.args || [])];

    try {
        const output = execFileSync('aws', execArgs, { encoding: 'utf8', timeout: 30000 });
        return { result: output };
    } catch (e: any) {
        return { error: e.stderr || e.message, isError: true };
    }
  }
};
