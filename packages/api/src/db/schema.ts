import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import type { CompiledPolicy } from '@clerk/shared'

export const agentTypeEnum = pgEnum('agent_type', ['sentinel', 'treasury', 'commerce', 'growth'])

export const industryEnum = pgEnum('industry', ['freelancer', 'ecommerce', 'agency', 'other'])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'created',
  'approved',
  'completed',
  'refunded',
  'disputed',
  'flagged',
  'failed',
])

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  industry: industryEnum('industry').notNull().default('other'),
  paypalConnected: boolean('paypal_connected').notNull().default(false),
  paypalMerchantId: varchar('paypal_merchant_id', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    type: agentTypeEnum('type').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('agents_tenant_idx').on(t.tenantId)],
)

export const rules = pgTable(
  'rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentType: agentTypeEnum('agent_type').notNull(),
    naturalLanguage: text('natural_language').notNull(),
    compiledPolicy: jsonb('compiled_policy').$type<CompiledPolicy>(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rules_tenant_idx').on(t.tenantId, t.agentType)],
)

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    paypalOrderId: varchar('paypal_order_id', { length: 64 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: transactionStatusEnum('status').notNull().default('created'),
    riskScore: integer('risk_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transactions_tenant_idx').on(t.tenantId, t.createdAt),
    index('transactions_paypal_order_idx').on(t.tenantId, t.paypalOrderId),
  ],
)

export const agentActions = pgTable(
  'agent_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    agentType: agentTypeEnum('agent_type').notNull(),
    actionType: varchar('action_type', { length: 100 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    result: jsonb('result').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('agent_actions_tenant_idx').on(t.tenantId, t.createdAt)],
)
