import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { executors } from '@/nodes/executors';

import { runWorkflow } from './runner';
import { isPrivateAddress } from './safe-fetch';
import { resolveTemplate } from './template';
import type { Diagram, ExecutionContext, NodeExecutor } from './types';

const node = (id: string, type: string, properties: Record<string, unknown> = {}) => ({
  id,
  data: { type, properties: { label: id, status: 'active', ...properties } },
});
const edge = (source: string, target: string, sourceHandle?: string) => ({
  id: `${source}-${target}`,
  source,
  target,
  sourceHandle,
});

const echo: NodeExecutor<{ value?: string }> = ({ properties, resolve }) => ({
  output: { value: resolve(properties.value ?? '') },
});
const testExecutors = { ...executors, echo } as Record<string, NodeExecutor<never>>;

function run(diagram: Diagram, input: unknown = { body: { amount: 150, name: 'Ada' } }) {
  return runWorkflow({ workflowId: 'wf', runId: 'run', diagram, input, executors: testExecutors });
}

describe('runWorkflow', () => {
  it('runs blocks in order and passes data along', async () => {
    const result = await run({
      nodes: [node('t', 'trigger'), node('a', 'echo', { value: 'Hi {{trigger.body.name}}' }), node('b', 'echo', { value: '{{nodes.a.value}}!' })],
      edges: [edge('t', 'a'), edge('a', 'b')],
    });
    assert.equal(result.status, 'success');
    assert.deepEqual(
      result.steps.map((step) => step.output),
      [{ body: { amount: 150, name: 'Ada' } }, { value: 'Hi Ada' }, { value: 'Hi Ada!' }],
    );
  });

  it('follows only the matching branch and skips the rest', async () => {
    const branches = [
      { id: '1', sourceHandle: 'big', label: 'Big', conditions: [{ x: '{{trigger.body.amount}}', comparisonOperator: 'isGreaterThan', y: '100' }] },
      { id: '2', sourceHandle: 'else', label: 'Else', conditions: [] },
    ];
    const result = await run({
      nodes: [node('t', 'trigger'), node('b', 'branch', { decisionBranches: branches }), node('big', 'echo'), node('small', 'echo'), node('after-small', 'echo')],
      edges: [edge('t', 'b'), edge('b', 'big', 'big'), edge('b', 'small', 'else'), edge('small', 'after-small')],
    });
    assert.equal(result.status, 'success');
    const byId = Object.fromEntries(result.steps.map((step) => [step.nodeId, step.status]));
    assert.deepEqual(byId, { t: 'success', b: 'success', big: 'success', small: 'skipped', 'after-small': 'skipped' });
  });

  it('waits for both inputs before running a block that joins two paths', async () => {
    const result = await run({
      nodes: [node('t', 'trigger'), node('a', 'echo', { value: 'A' }), node('b', 'echo', { value: 'B' }), node('join', 'echo', { value: '{{nodes.a.value}}{{nodes.b.value}}' })],
      edges: [edge('t', 'a'), edge('t', 'b'), edge('a', 'join'), edge('b', 'join')],
    });
    assert.equal(result.status, 'success');
    assert.deepEqual(result.steps.at(-1)?.output, { value: 'AB' });
  });

  it('passes through disabled blocks', async () => {
    const result = await run({
      nodes: [node('t', 'trigger'), node('off', 'echo', { status: 'disabled' }), node('c', 'echo', { value: 'ran' })],
      edges: [edge('t', 'off'), edge('off', 'c')],
    });
    assert.deepEqual(result.steps.map((step) => step.status), ['success', 'skipped', 'success']);
  });

  it('fails with a readable message on a missing reference', async () => {
    const result = await run({
      nodes: [node('t', 'trigger'), node('a', 'echo', { value: '{{nodes.nope.value}}' })],
      edges: [edge('t', 'a')],
    });
    assert.equal(result.status, 'failed');
    assert.match(result.error ?? '', /^a: Unresolved reference/);
  });

  it('rejects loops and missing triggers', async () => {
    const loop = await run({ nodes: [node('t', 'trigger'), node('a', 'echo'), node('b', 'echo')], edges: [edge('t', 'a'), edge('a', 'b'), edge('b', 'a')] });
    assert.match(loop.error ?? '', /loop/);
    const noTrigger = await run({ nodes: [node('a', 'echo')], edges: [] });
    assert.match(noTrigger.error ?? '', /Trigger/);
  });
});

describe('resolveTemplate', () => {
  const context = { trigger: { a: { b: 1 } }, nodeOutputs: {}, global: { key: 'k' } } as unknown as ExecutionContext;
  it('supports optional and default modifiers', () => {
    assert.equal(resolveTemplate('{{trigger.a.b}}-{{global.key}}', context), '1-k');
    assert.equal(resolveTemplate('[{{trigger.x?}}]', context), '[]');
    assert.equal(resolveTemplate("{{trigger.x | default:'n/a'}}", context), 'n/a');
    assert.equal(resolveTemplate('{{trigger.a}}', context), '{"b":1}');
  });
});

describe('isPrivateAddress', () => {
  it('blocks local and private ranges', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.1', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fd00::1']) {
      assert.equal(isPrivateAddress(address), true, address);
    }
    for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) {
      assert.equal(isPrivateAddress(address), false, address);
    }
  });
});
