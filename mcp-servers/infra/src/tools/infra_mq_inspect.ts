import { execFileSync } from 'node:child_process';

export const infraMqInspect = {
  name: 'infra_mq_inspect',
  description: 'Inspect message queues (Kafka or RabbitMQ). Read-only operations only (list topics, list queues, consume small batches).',
  inputSchema: {
    type: 'object',
    properties: {
      system: { type: 'string', enum: ['kafka', 'rabbitmq'], description: 'The message queue system' },
      operation: { type: 'string', enum: ['list', 'consume'], description: 'The operation to perform' },
      target: { type: 'string', description: 'Topic or queue name (required for consume)' },
      connectionArgs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Connection arguments (e.g. for kafka: ["--bootstrap-server", "localhost:9092"])'
      }
    },
    required: ['system', 'operation']
  },
  async handler(params: { system: 'kafka' | 'rabbitmq'; operation: 'list' | 'consume'; target?: string; connectionArgs?: string[] }) {
    if (params.operation === 'consume' && !params.target) {
        return { error: 'target (topic/queue) is required for consume operation', isError: true };
    }

    let bin = '';
    let args: string[] = [];

    if (params.system === 'kafka') {
        if (params.operation === 'list') {
            bin = 'kafka-topics.sh';
            args = ['--list', ...(params.connectionArgs || [])];
        } else if (params.operation === 'consume') {
            bin = 'kafka-console-consumer.sh';
            args = ['--topic', params.target!, '--max-messages', '10', ...(params.connectionArgs || [])];
        }
    } else if (params.system === 'rabbitmq') {
        if (params.operation === 'list') {
            bin = 'rabbitmqadmin';
            args = ['list', 'queues', ...(params.connectionArgs || [])];
        } else if (params.operation === 'consume') {
            bin = 'rabbitmqadmin';
            args = ['get', `queue=${params.target}`, 'count=10', 'requeue=true', ...(params.connectionArgs || [])];
        }
    }

    try {
        const output = execFileSync(bin, args, { encoding: 'utf8', timeout: 30000 });
        return { result: output };
    } catch (e: any) {
        return { error: e.stderr || e.message, isError: true };
    }
  }
};
