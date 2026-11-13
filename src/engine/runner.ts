import type { RunStep } from '@/db/schema';

import { resolveTemplate, resolveValue } from './template';
import {
  type Diagram,
  type DiagramEdge,
  type DiagramNode,
  type ExecutionContext,
  NodeError,
  type NodeExecutor,
  START_NODE_TYPES,
} from './types';

export type RunOptions = {
  workflowId: string;
  runId: string;
  diagram: Diagram;
  /** Data that started the run (webhook body or manual input). */
  input: unknown;
  /** Executors by node type. See src/nodes/executors.ts. */
  executors: Record<string, NodeExecutor<never>>;
  /** Called after every block, so progress can be saved while the run continues. */
  onStep?: (step: RunStep, steps: RunStep[]) => Promise<void> | void;
  /** Whole-run time limit. Defaults to 5 minutes. */
  timeoutMs?: number;
  /** Safety limit on the number of blocks executed. */
  maxSteps?: number;
};

export type RunResult = {
  status: 'success' | 'failed';
  steps: RunStep[];
  error?: string;
};

/**
 * Runs a workflow diagram from its trigger block.
 *
 * Blocks run in dependency order. A block waits until every connection coming
 * into it has either delivered or been skipped (for example, the branch not
 * taken). A block whose incoming connections were all skipped is skipped too,
 * along with everything after it. Blocks marked Disabled or Draft in the editor
 * are passed through: skipped, but the flow continues after them.
 */
export async function runWorkflow(options: RunOptions): Promise<RunResult> {
  const { diagram, executors, onStep, timeoutMs = 5 * 60_000, maxSteps = 200 } = options;
  const steps: RunStep[] = [];

  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]));
  const edges = diagram.edges.filter((edge) => nodesById.has(edge.source) && nodesById.has(edge.target));

  const startNodes = diagram.nodes.filter((node) => START_NODE_TYPES.includes(node.data.type));
  if (startNodes.length !== 1) {
    return fail(
      startNodes.length === 0
        ? 'Add a Trigger or Schedule block to start the workflow.'
        : 'Use only one start block (Trigger or Schedule).',
    );
  }
  const start = startNodes[0]!;

  // Only the part of the graph reachable from the trigger takes part in the run.
  const outgoing = groupBy(edges, (edge) => edge.source);
  const reachable = collectReachable(start.id, outgoing);
  const liveEdges = edges.filter((edge) => reachable.has(edge.source) && reachable.has(edge.target));

  if (hasCycle(reachable, groupBy(liveEdges, (edge) => edge.source))) {
    return fail('This workflow has a loop. Loops are not supported yet; remove the connection that goes back.');
  }

  const incomingCount = new Map<string, number>();
  for (const edge of liveEdges) incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  const pending = new Map(incomingCount);
  const receivedLive = new Set<string>();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Run timed out')), timeoutMs);

  const context: ExecutionContext = {
    workflowId: options.workflowId,
    runId: options.runId,
    trigger: options.input ?? {},
    nodeOutputs: {},
    global: buildGlobals(diagram),
    signal: controller.signal,
  };

  const liveOutgoing = groupBy(liveEdges, (edge) => edge.source);
  const ready: string[] = [start.id];

  try {
    while (ready.length > 0) {
      if (controller.signal.aborted) throw new NodeError('The run took longer than the time limit.');
      if (steps.length >= maxSteps) throw new NodeError(`Stopped after ${maxSteps} blocks.`);

      const nodeId = ready.shift()!;
      const node = nodesById.get(nodeId)!;
      const isLive = nodeId === start.id || receivedLive.has(nodeId);

      let nextPort: string | null | undefined;
      let continueFlow = isLive;

      if (!isLive) {
        await record(node, { status: 'skipped', startedAt: new Date(), durationMs: 0 });
      } else if (isPassThrough(node)) {
        await record(node, { status: 'skipped', startedAt: new Date(), durationMs: 0, output: 'Disabled in the editor' });
      } else {
        const startedAt = new Date();
        const executor = executors[node.data.type];
        try {
          if (!executor) throw new NodeError(`No executor registered for block type "${node.data.type}".`);
          const result = await executor({
            node,
            properties: (node.data.properties ?? {}) as never,
            context,
            resolve: (template: string) => resolveTemplate(template, context),
            resolveValue: (template: string) => resolveValue(template, context),
          });
          context.nodeOutputs[node.id] = result.output ?? null;
          nextPort = result.nextPort;
          await record(node, { status: 'success', startedAt, durationMs: Date.now() - startedAt.getTime(), output: result.output });
        } catch (error) {
          const message = errorMessage(error, controller.signal);
          await record(node, { status: 'failed', startedAt, durationMs: Date.now() - startedAt.getTime(), error: message });
          throw new RunFailure(`${labelOf(node)}: ${message}`);
        }
        if (nextPort === null) continueFlow = false; // executor chose to stop this path
      }

      for (const edge of liveOutgoing.get(nodeId) ?? []) {
        const edgeIsLive = continueFlow && (nextPort === undefined || edge.sourceHandle === nextPort);
        if (edgeIsLive) receivedLive.add(edge.target);
        const remaining = (pending.get(edge.target) ?? 1) - 1;
        pending.set(edge.target, remaining);
        if (remaining === 0) ready.push(edge.target);
      }
    }
    return { status: 'success', steps };
  } catch (error) {
    return fail(error instanceof RunFailure || error instanceof NodeError ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }

  async function record(node: DiagramNode, step: Omit<RunStep, 'nodeId' | 'nodeType' | 'label' | 'startedAt'> & { startedAt: Date }) {
    const entry: RunStep = {
      nodeId: node.id,
      nodeType: node.data.type,
      label: labelOf(node),
      ...step,
      startedAt: step.startedAt.toISOString(),
      output: limitSize(step.output),
    };
    steps.push(entry);
    await onStep?.(entry, steps);
  }

  function fail(error: string): RunResult {
    return { status: 'failed', steps, error };
  }
}

class RunFailure extends Error {}

function isPassThrough(node: DiagramNode) {
  const status = node.data.properties?.status;
  return status === 'disabled' || status === 'draft';
}

function labelOf(node: DiagramNode) {
  const label = node.data.properties?.label;
  return typeof label === 'string' && label.trim() ? label : node.data.type;
}

function buildGlobals(diagram: Diagram) {
  const globals: Record<string, unknown> = {};
  for (const [id, variable] of Object.entries(diagram.globalVariables ?? {})) {
    if (!variable) continue;
    globals[id] = variable.defaultValue ?? '';
    if (variable.name) globals[variable.name] = variable.defaultValue ?? '';
  }
  return globals;
}

function groupBy(edges: DiagramEdge[], key: (edge: DiagramEdge) => string) {
  const map = new Map<string, DiagramEdge[]>();
  for (const edge of edges) {
    const list = map.get(key(edge)) ?? [];
    list.push(edge);
    map.set(key(edge), list);
  }
  return map;
}

function collectReachable(startId: string, outgoing: Map<string, DiagramEdge[]>) {
  const seen = new Set<string>([startId]);
  const stack = [startId];
  while (stack.length > 0) {
    for (const edge of outgoing.get(stack.pop()!) ?? []) {
      if (!seen.has(edge.target)) {
        seen.add(edge.target);
        stack.push(edge.target);
      }
    }
  }
  return seen;
}

function hasCycle(nodes: Set<string>, outgoing: Map<string, DiagramEdge[]>) {
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'visiting') return true;
    if (state.get(id) === 'done') return false;
    state.set(id, 'visiting');
    for (const edge of outgoing.get(id) ?? []) if (visit(edge.target)) return true;
    state.set(id, 'done');
    return false;
  };
  for (const id of nodes) if (visit(id)) return true;
  return false;
}

function errorMessage(error: unknown, signal: AbortSignal) {
  if (signal.aborted) return 'The run took longer than the time limit.';
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Keeps run logs small: very large outputs are truncated before saving. */
function limitSize(value: unknown, maxChars = 20_000): unknown {
  if (value === undefined) return undefined;
  const json = JSON.stringify(value);
  if (json === undefined || json.length <= maxChars) return value;
  return { truncated: true, preview: json.slice(0, maxChars) };
}
