import { type NodeExecutor, NodeError } from '@/engine/types';

/**
 * Builds a new object from "name = value" lines, for example:
 *
 *   email = {{trigger.body.email}}
 *   company.size = {{nodes.lookup.body.employees}}
 *   note = New sign-up from {{trigger.body.country}}
 *
 * Dotted names create nested objects. A value that is a single reference
 * keeps its original type; other values become text, except plain numbers,
 * true/false and null, which keep their meaning.
 */
export const executeTransform: NodeExecutor<{ fields?: string }> = ({ properties, resolveValue }) => {
  const output: Record<string, unknown> = {};
  const lines = (properties.fields ?? '').split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) throw new NodeError(`Line ${index + 1} must look like "name = value".`);
    const name = trimmed.slice(0, separator).trim();
    if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(name)) {
      throw new NodeError(`"${name}" on line ${index + 1} is not a valid name. Use letters, numbers and dots.`);
    }
    setPath(output, name.split('.'), coerce(resolveValue(trimmed.slice(separator + 1).trim())));
  });

  if (Object.keys(output).length === 0) throw new NodeError('Add at least one field, like: email = {{trigger.body.email}}');
  return { output };
};

export function coerce(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  return value;
}

function setPath(target: Record<string, unknown>, path: string[], value: unknown) {
  let current = target;
  for (const key of path.slice(0, -1)) {
    if (typeof current[key] !== 'object' || current[key] === null) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[path.at(-1)!] = value;
}
