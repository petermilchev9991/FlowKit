import { type Condition, matchesAll } from '@/engine/conditions';
import type { NodeExecutor } from '@/engine/types';

type Branch = { id?: string; sourceHandle?: string; label?: string; conditions?: Condition[] };
type Properties = { decisionBranches?: Branch[] };

/**
 * Checks branches top to bottom and continues along the first one that
 * matches. A branch with no conditions always matches, so it works as "else".
 * When nothing matches, this path of the workflow stops (the run still succeeds).
 */
export const executeBranch: NodeExecutor<Properties> = ({ properties, resolve }) => {
  const branches = properties.decisionBranches ?? [];
  for (const [index, branch] of branches.entries()) {
    if (!branch.sourceHandle) continue;
    if (matchesAll(branch.conditions ?? [], resolve)) {
      return {
        output: { matchedBranch: branch.label || `Branch ${index + 1}` },
        nextPort: branch.sourceHandle,
      };
    }
  }
  return { output: { matchedBranch: null }, nextPort: null };
};
