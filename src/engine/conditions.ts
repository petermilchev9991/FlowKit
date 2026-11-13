/**
 * Comparisons shared by the Branch and Filter blocks. Values are compared as
 * text, except the "greater/less" checks (numbers) and before/after (dates).
 */

export type Condition = { x?: string; comparisonOperator?: string; y?: string; logicalOperator?: 'AND' | 'OR' | string };

type Resolve = (template: string) => string;

/** All conditions joined by their AND/OR operators, left to right. No conditions always matches. */
export function matchesAll(conditions: Condition[], resolve: Resolve) {
  if (conditions.length === 0) return true;
  let result = evaluate(conditions[0]!, resolve);
  for (const condition of conditions.slice(1)) {
    const value = evaluate(condition, resolve);
    result = condition.logicalOperator === 'OR' ? result || value : result && value;
  }
  return result;
}

export function evaluate(condition: Condition, resolve: Resolve) {
  const left = resolve(condition.x ?? '');
  const right = resolve(condition.y ?? '');
  return compare(left, condition.comparisonOperator, right);
}

export function compare(left: string, operator: string | undefined, right: string) {
  switch (operator) {
    case 'isEqual':
      return left === right;
    case 'isNotEqual':
      return left !== right;
    case 'isContaining':
      return left.toLowerCase().includes(right.toLowerCase());
    case 'isNotContaining':
      return !left.toLowerCase().includes(right.toLowerCase());
    case 'isGreaterThan':
      return Number(left) > Number(right);
    case 'isLessThan':
      return Number(left) < Number(right);
    case 'isGreaterThanOrEqual':
      return Number(left) >= Number(right);
    case 'isLessThanOrEqual':
      return Number(left) <= Number(right);
    case 'isBefore':
      return new Date(left).getTime() < new Date(right).getTime();
    case 'isAfter':
      return new Date(left).getTime() > new Date(right).getTime();
    case 'isEmpty':
      return isEmptyValue(left);
    case 'isNotEmpty':
      return !isEmptyValue(left);
    default:
      return false;
  }
}

function isEmptyValue(value: string) {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === 'null' || trimmed === '[]' || trimmed === '{}';
}
