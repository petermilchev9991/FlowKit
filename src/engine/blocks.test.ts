import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { executors } from '@/nodes/executors';

import { runWorkflow } from './runner';
import { describeSchedule, nextRunAfter, validateSchedule } from './schedule-time';
import type { Diagram } from './types';

const node = (id: string, type: string, properties: Record<string, unknown> = {}) => ({
  id,
  data: { type, properties: { label: id, status: 'active', ...properties } },
});
const edge = (source: string, target: string) => ({ id: `${source}-${target}`, source, target });

function run(diagram: Diagram, input: unknown = { body: { total: 750, email: 'ada@acme.com', items: [1, 2, 3] } }) {
  return runWorkflow({ workflowId: 'wf', runId: 'run', diagram, input, executors });
}

describe('schedule times', () => {
  const after = new Date('2026-03-27T10:17:00Z'); // a Friday

  it('every N minutes rounds up to the next slot', () => {
    assert.equal(nextRunAfter({ frequency: 'minutes', everyMinutes: 15 }, after).toISOString(), '2026-03-27T10:30:00.000Z');
  });

  it('hourly at a minute', () => {
    assert.equal(nextRunAfter({ frequency: 'hourly', minute: 5 }, after).toISOString(), '2026-03-27T11:05:00.000Z');
    assert.equal(nextRunAfter({ frequency: 'hourly', minute: 45 }, after).toISOString(), '2026-03-27T10:45:00.000Z');
  });

  it('daily in a time zone, including across a daylight-saving change', () => {
    // 09:00 in London is 09:00 UTC before 29 March 2026 and 08:00 UTC after it.
    assert.equal(
      nextRunAfter({ frequency: 'daily', time: '09:00', timezone: 'Europe/London' }, after).toISOString(),
      '2026-03-28T09:00:00.000Z',
    );
    assert.equal(
      nextRunAfter({ frequency: 'daily', time: '09:00', timezone: 'Europe/London' }, new Date('2026-03-28T09:30:00Z')).toISOString(),
      '2026-03-29T08:00:00.000Z',
    );
  });

  it('weekly on a given day', () => {
    assert.equal(
      nextRunAfter({ frequency: 'weekly', weekday: 'monday', time: '08:30', timezone: 'America/New_York' }, after).toISOString(),
      '2026-03-30T12:30:00.000Z',
    );
  });

  it('explains invalid settings', () => {
    assert.match(validateSchedule({ frequency: 'minutes', everyMinutes: 1 }) ?? '', /5 to 720/);
    assert.match(validateSchedule({ frequency: 'daily', time: '25:00' }) ?? '', /HH:MM/);
    assert.match(validateSchedule({ frequency: 'daily', timezone: 'Mars/Base' }) ?? '', /not a time zone/);
    assert.equal(describeSchedule({ frequency: 'weekly', weekday: 'friday', time: '17:00' }), 'Every Friday at 17:00 (UTC)');
  });
});

describe('Filter block', () => {
  it('continues when the condition is true and skips the rest when false', async () => {
    const diagram = (threshold: string) => ({
      nodes: [node('t', 'trigger'), node('f', 'filter', { value: '{{trigger.body.total}}', operator: 'isGreaterThan', compareTo: threshold }), node('after', 'transform', { fields: 'ok = yes' })],
      edges: [edge('t', 'f'), edge('f', 'after')],
    });
    const passed = await run(diagram('500'));
    assert.deepEqual(passed.steps.map((step) => step.status), ['success', 'success', 'success']);
    const stopped = await run(diagram('1000'));
    assert.equal(stopped.status, 'success');
    assert.deepEqual(stopped.steps.map((step) => step.status), ['success', 'success', 'skipped']);
  });
});

describe('Transform block', () => {
  it('builds nested objects and keeps types of single references', async () => {
    const result = await run({
      nodes: [
        node('t', 'trigger'),
        node('x', 'transform', {
          fields: 'customer.email = {{trigger.body.email}}\nitems = {{trigger.body.items}}\ncount = 3\ngreeting = Hi {{trigger.body.email}}\n# comments are ignored',
        }),
      ],
      edges: [edge('t', 'x')],
    });
    assert.equal(result.status, 'success');
    assert.deepEqual(result.steps.at(-1)?.output, {
      customer: { email: 'ada@acme.com' },
      items: [1, 2, 3],
      count: 3,
      greeting: 'Hi ada@acme.com',
    });
  });

  it('reports a bad line clearly', async () => {
    const result = await run({ nodes: [node('t', 'trigger'), node('x', 'transform', { fields: 'no equals sign' })], edges: [edge('t', 'x')] });
    assert.match(result.error ?? '', /Line 1 must look like/);
  });
});

describe('Schedule block', () => {
  it('can start a workflow like a trigger', async () => {
    const result = await run(
      { nodes: [node('s', 'schedule', { frequency: 'daily' }), node('x', 'transform', { fields: 'when = {{trigger.scheduledFor}}' })], edges: [edge('s', 'x')] },
      { scheduledFor: '2026-01-01T09:00:00.000Z', source: 'schedule' },
    );
    assert.deepEqual(result.steps.at(-1)?.output, { when: '2026-01-01T09:00:00.000Z' });
  });
});

describe('Send email and Chat message blocks', () => {
  it('explain missing setup instead of failing silently', async () => {
    delete process.env.RESEND_API_KEY;
    const email = await run({ nodes: [node('t', 'trigger'), node('e', 'send-email', { to: 'a@b.co', subject: 'Hi', body: 'Hello' })], edges: [edge('t', 'e')] });
    assert.match(email.error ?? '', /RESEND_API_KEY/);
    const chat = await run({ nodes: [node('t', 'trigger'), node('c', 'chat-message', { webhookUrl: '', message: 'Hi' })], edges: [edge('t', 'c')] });
    assert.match(chat.error ?? '', /webhook URL/);
  });
});
