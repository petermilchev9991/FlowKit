import { compare } from '@/engine/conditions';
import { type NodeExecutor, NodeError } from '@/engine/types';

type Properties = { value?: string; operator?: string; compareTo?: string };

/** Continues the workflow only when the condition is true; otherwise this path stops quietly. */
export const executeFilter: NodeExecutor<Properties> = ({ properties, resolve }) => {
  if (!properties.operator) throw new NodeError('Choose a condition.');
  const passed = compare(resolve(properties.value ?? ''), properties.operator, resolve(properties.compareTo ?? ''));
  return { output: { passed }, nextPort: passed ? undefined : null };
};
