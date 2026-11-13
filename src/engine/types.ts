/**
 * Types shared by the execution engine and every node executor.
 * Nothing here imports the editor SDK, so it is safe to use on the server.
 */

export type DiagramNode = {
  id: string;
  type?: string;
  data: {
    type: string;
    properties?: Record<string, unknown>;
  };
};

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  /** Set when an edge leaves a specific output, such as one branch of a Branch block. */
  sourceHandle?: string | null;
};

export type Diagram = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  globalVariables?: Record<string, { name?: string; defaultValue?: string } | undefined>;
};

export type ExecutionContext = {
  workflowId: string;
  runId: string;
  /** Data that started the run: the webhook body, or the input of a manual run. */
  trigger: unknown;
  /** Outputs of finished blocks, keyed by node id. Referenced as {{nodes.<id>.<field>}}. */
  nodeOutputs: Record<string, unknown>;
  /** Workflow variables, keyed by variable id and by name. Referenced as {{global.<key>}}. */
  global: Record<string, unknown>;
  /** Aborted when the run times out. Pass it to fetch() and long waits. */
  signal: AbortSignal;
};

export type NodeResult = {
  /** Saved in the run log and available to later blocks. */
  output?: unknown;
  /**
   * For blocks with several outputs (like Branch): the handle id to continue
   * from. Edges leaving any other handle are skipped. Leave undefined to
   * continue along every outgoing edge.
   */
  nextPort?: string | null;
};

export type ExecutorArgs<P> = {
  node: DiagramNode;
  properties: P;
  context: ExecutionContext;
  /** Replaces {{...}} references in a string with values from the context. */
  resolve: (template: string) => string;
  /** Like resolve, but a lone reference such as "{{nodes.x.items}}" keeps its type (list, number, object). */
  resolveValue: (template: string) => unknown;
};

export type NodeExecutor<P = Record<string, unknown>> = (args: ExecutorArgs<P>) => Promise<NodeResult> | NodeResult;

/** Block types that can start a workflow. A workflow has exactly one of them. */
export const START_NODE_TYPES = ['trigger', 'schedule'];

/** Thrown by executors for problems the user must fix (bad URL, missing API key...). */
export class NodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NodeError';
  }
}
