import type { WorkflowDiagram } from '@/db/schema';

/**
 * What a new workflow contains: Trigger -> HTTP request -> Branch.
 * Small enough to understand at a glance, and it runs successfully as is.
 */
export function starterDiagram(): WorkflowDiagram {
  const okHandle = `branch-${crypto.randomUUID()}`;
  const elseHandle = `branch-${crypto.randomUUID()}`;

  return {
    layoutDirection: 'RIGHT',
    globalVariables: {},
    nodes: [
      {
        id: 'trigger',
        type: 'node',
        position: { x: 0, y: 120 },
        data: {
          type: 'trigger',
          icon: 'Lightning',
          isStartNode: true,
          properties: { label: 'Trigger', description: 'Run button or webhook', status: 'active' },
        },
      },
      {
        id: 'fetch-todo',
        type: 'node',
        position: { x: 340, y: 120 },
        data: {
          type: 'http-request',
          icon: 'Globe',
          properties: {
            label: 'Fetch a to-do',
            description: 'GET a public test API',
            status: 'active',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            headers: '',
            body: '',
          },
        },
      },
      {
        id: 'check-status',
        type: 'decision-node',
        position: { x: 680, y: 120 },
        data: {
          type: 'branch',
          icon: 'ArrowsSplit',
          properties: {
            label: 'Did it work?',
            description: 'Checks the status code',
            status: 'active',
            decisionBranches: [
              {
                id: crypto.randomUUID(),
                sourceHandle: okHandle,
                label: 'Success',
                conditions: [{ x: '{{nodes.fetch-todo.status}}', comparisonOperator: 'isEqual', y: '200', logicalOperator: 'AND' }],
              },
              { id: crypto.randomUUID(), sourceHandle: elseHandle, label: 'Otherwise', conditions: [] },
            ],
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-trigger-fetch',
        source: 'trigger',
        sourceHandle: 'source',
        target: 'fetch-todo',
        targetHandle: 'target',
        type: 'labelEdge',
      },
      {
        id: 'edge-fetch-check',
        source: 'fetch-todo',
        sourceHandle: 'source',
        target: 'check-status',
        targetHandle: 'target',
        type: 'labelEdge',
      },
    ],
  };
}
