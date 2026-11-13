import { relations } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/*  Auth tables (Better Auth core schema)                                      */
/*  If you add Better Auth plugins that need new columns, run                  */
/*  `npx @better-auth/cli generate` to see what they expect.                   */
/* -------------------------------------------------------------------------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

/* -------------------------------------------------------------------------- */
/*  App tables                                                                 */
/* -------------------------------------------------------------------------- */

/** The diagram exactly as the editor saves it (nodes, edges, layout, variables). */
export type WorkflowDiagram = {
  name?: string;
  layoutDirection?: 'DOWN' | 'RIGHT';
  globalVariables?: Record<string, unknown>;
  nodes: unknown[];
  edges: unknown[];
};

export const workflows = pgTable(
  'workflows',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    diagram: jsonb('diagram').$type<WorkflowDiagram>().notNull(),
    /** Secret part of the public webhook URL. Rotate it to revoke old URLs. */
    webhookToken: text('webhook_token').notNull().unique(),
    /** When the Schedule block should next start this workflow; null when it has none. */
    nextRunAt: timestamp('next_run_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('workflows_user_id_idx').on(t.userId), index('workflows_next_run_at_idx').on(t.nextRunAt)],
);

export type RunStatus = 'running' | 'success' | 'failed';
export type RunTrigger = 'manual' | 'webhook' | 'schedule';
export type StepStatus = 'success' | 'failed' | 'skipped';

export type RunStep = {
  nodeId: string;
  nodeType: string;
  label: string;
  status: StepStatus;
  startedAt: string;
  durationMs: number;
  output?: unknown;
  error?: string;
};

export const runs = pgTable(
  'runs',
  {
    id: text('id').primaryKey(),
    workflowId: text('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').$type<RunStatus>().notNull(),
    trigger: text('trigger').$type<RunTrigger>().notNull(),
    input: jsonb('input').$type<unknown>(),
    steps: jsonb('steps').$type<RunStep[]>().notNull().default([]),
    error: text('error'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    finishedAt: timestamp('finished_at'),
  },
  (t) => [index('runs_workflow_id_idx').on(t.workflowId), index('runs_user_started_idx').on(t.userId, t.startedAt)],
);

/** One row per Lemon Squeezy subscription, kept up to date by the webhook. */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(), // Lemon Squeezy subscription id
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').notNull(),
    variantId: text('variant_id').notNull(),
    /** on_trial | active | paused | past_due | unpaid | cancelled | expired */
    status: text('status').notNull(),
    renewsAt: timestamp('renews_at'),
    endsAt: timestamp('ends_at'),
    quantity: integer('quantity').notNull().default(1),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('subscriptions_user_id_idx').on(t.userId)],
);

export const workflowsRelations = relations(workflows, ({ many, one }) => ({
  runs: many(runs),
  owner: one(user, { fields: [workflows.userId], references: [user.id] }),
}));

export const runsRelations = relations(runs, ({ one }) => ({
  workflow: one(workflows, { fields: [runs.workflowId], references: [workflows.id] }),
}));
