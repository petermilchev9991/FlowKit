import { type ExecutionContext, NodeError } from './types';

/**
 * Resolves {{...}} references in a string, using the same syntax the editor's
 * variable picker inserts:
 *
 *   {{trigger.email}}            data that started the run
 *   {{nodes.<nodeId>.status}}    output of an earlier block
 *   {{global.<variable>}}        workflow variable
 *
 * Modifiers:
 *   {{nodes.x.y?}}               empty string when missing (instead of failing)
 *   {{nodes.x.y | default:'n/a'}} fallback value when missing
 *
 * Objects and arrays are inserted as JSON.
 */
const TEMPLATE_PATTERN = /\{\{\s*([^}|?]+?)\s*(\?)?\s*(?:\|\s*default\s*:\s*'((?:[^'\\]|\\.)*)')?\s*\}\}/g;

const MISSING = Symbol('missing');

export function resolveTemplate(template: string, context: ExecutionContext): string {
  if (typeof template !== 'string' || !template.includes('{{')) return template ?? '';

  return template.replace(TEMPLATE_PATTERN, (match, rawPath: string, optional?: string, fallback?: string) => {
    const value = lookup(rawPath.trim(), context);
    if (value === MISSING || value === undefined) {
      if (fallback !== undefined) return fallback.replace(/\\'/g, "'");
      if (optional) return '';
      throw new NodeError(`Unresolved reference ${match}. Check the name, or add "?" to allow an empty value.`);
    }
    return stringify(value);
  });
}

const SINGLE_REFERENCE = /^\{\{\s*([^}|?]+?)\s*(\?)?\s*(?:\|\s*default\s*:\s*'((?:[^'\\]|\\.)*)')?\s*\}\}$/;

/**
 * Like resolveTemplate, but when the whole template is a single reference
 * (for example "{{nodes.fetch.body.items}}") it returns the value itself,
 * keeping numbers, lists and objects as they are. Anything else is text.
 */
export function resolveValue(template: string, context: ExecutionContext): unknown {
  const match = typeof template === 'string' ? template.trim().match(SINGLE_REFERENCE) : null;
  if (!match) return resolveTemplate(template, context);
  const [, rawPath, optional, fallback] = match;
  const value = lookup(rawPath!.trim(), context);
  if (value === MISSING || value === undefined) {
    if (fallback !== undefined) return fallback.replace(/\\'/g, "'");
    if (optional) return null;
    throw new NodeError(`Unresolved reference ${template.trim()}. Check the name, or add "?" to allow an empty value.`);
  }
  return value;
}

function lookup(path: string, context: ExecutionContext): unknown {
  const [namespace, ...rest] = path.split('.');
  let current: unknown;
  switch (namespace) {
    case 'trigger':
      current = context.trigger;
      break;
    case 'nodes':
      current = context.nodeOutputs;
      break;
    case 'global':
    case 'variables':
      current = context.global;
      break;
    default:
      throw new NodeError(`Unknown reference "{{${path}}}". Use trigger., nodes. or global.`);
  }
  for (const key of rest) {
    if (current === null || typeof current !== 'object') return MISSING;
    if (!Object.prototype.hasOwnProperty.call(current, key)) return MISSING;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function stringify(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
