import { execSync } from 'node:child_process';

const BLOCKED_SQL_PATTERNS = [
  { pattern: /\bDROP\b/i, reason: 'DROP commands are blocked' },
  { pattern: /\bDELETE\b/i, reason: 'DELETE commands are blocked' },
  { pattern: /\bTRUNCATE\b/i, reason: 'TRUNCATE commands are blocked' },
  { pattern: /\bALTER\b/i, reason: 'ALTER commands are blocked' },
  { pattern: /\bUPDATE\b/i, reason: 'UPDATE commands are blocked' },
  { pattern: /\bINSERT\b/i, reason: 'INSERT commands are blocked' },
  { pattern: /\bGRANT\b/i, reason: 'GRANT commands are blocked' },
  { pattern: /\bREVOKE\b/i, reason: 'REVOKE commands are blocked' }
];

export const infraDbQuery = {
  name: 'infra_db_query',
  description: 'Executes a SQL query against a PostgreSQL, MySQL, or Supabase database. Strict read-only mode by default.',
  inputSchema: {
    type: 'object',
    properties: {
      connectionString: { type: 'string', description: 'Database connection URI (e.g., postgres://..., mysql://..., or supabase project ref/key format)' },
      query: { type: 'string', description: 'The SQL query to execute' },
      allowMutation: { type: 'boolean', description: 'Bypass read-only guardrails. USE WITH EXTREME CAUTION.' }
    },
    required: ['connectionString', 'query']
  },
  async handler(params: { connectionString: string; query: string; allowMutation?: boolean }) {
    if (!params.allowMutation) {
      for (const { pattern, reason } of BLOCKED_SQL_PATTERNS) {
        if (pattern.test(params.query)) {
          return { error: `Guardrail triggered: ${reason}. Mutation commands are blocked unless allowMutation is true.`, isError: true };
        }
      }
    }

    // Determine dialect and tool
    let command = '';
    
    // Naive local execution via generic DB CLI tools (psql, mysql). 
    // In a real environment, this might use node-postgres or mysql2 natively.
    // For now, we wrap the local CLIs.
    if (params.connectionString.startsWith('postgres://') || params.connectionString.startsWith('postgresql://')) {
        command = `psql "${params.connectionString}" -c "${params.query.replace(/"/g, '\\"')}"`;
    } else if (params.connectionString.startsWith('mysql://')) {
        command = `mysql "${params.connectionString}" -e "${params.query.replace(/"/g, '\\"')}"`;
    } else {
        return { error: 'Unsupported connection string format. Must start with postgres://, postgresql://, or mysql://', isError: true };
    }

    try {
        const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
        return { result: output };
    } catch (e: any) {
        return { error: e.stderr || e.message, isError: true };
    }
  }
};
