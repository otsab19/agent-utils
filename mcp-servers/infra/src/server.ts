import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import { infraDbQuery } from './tools/infra_db_query.js';
import { infraK8sExec } from './tools/infra_k8s_exec.js';
import { infraAwsCli } from './tools/infra_aws_cli.js';
import { infraAzureCli } from './tools/infra_azure_cli.js';
import { infraMqInspect } from './tools/infra_mq_inspect.js';

const tools = [
  infraDbQuery,
  infraK8sExec,
  infraAwsCli,
  infraAzureCli,
  infraMqInspect,
];

const server = new Server(
  {
    name: 'agent-mcp-infra',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((t) => t.name === request.params.name);
  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
  }

  try {
    const result = await tool.handler(request.params.arguments as any);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: result.isError ?? false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error.message}\n${error.stack}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AgentUtils Infra MCP Server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error in main():', err);
  process.exit(1);
});
