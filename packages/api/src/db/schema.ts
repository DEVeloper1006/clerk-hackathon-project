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
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  DeployStatus,
  ResourceStatus,
  ResourceType,
  type CompiledPolicy,
  type ResourceConfig,
} from '@clerk/shared'

export const agentTypeEnum = pgEnum('agent_type', [
  'sentinel',
  'treasury',
  'commerce',
  'growth',
  'infra',
])

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

/** Turns a shared string enum into the non-empty tuple pgEnum wants, keeping the enum's type. */
const enumValues = <T extends string>(e: Record<string, T>) => Object.values(e) as [T, ...T[]]

// Values come straight from the shared enums so the DB and TypeScript can't drift.
export const resourceTypeEnum = pgEnum('resource_type', enumValues(ResourceType))
export const resourceStatusEnum = pgEnum('resource_status', enumValues(ResourceStatus))
export const deployStatusEnum = pgEnum('deploy_status', enumValues(DeployStatus))

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

export const resources = pgTable(
  'resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    type: resourceTypeEnum('type').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    renderServiceId: varchar('render_service_id', { length: 100 }),
    status: resourceStatusEnum('status').notNull().default(ResourceStatus.Requested),
    config: jsonb('config').$type<ResourceConfig>().notNull().default({}),
    monthlyCostCents: integer('monthly_cost_cents').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('resources_tenant_idx').on(t.tenantId, t.status)],
)

export const deployments = pgTable(
  'deployments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    renderDeployId: varchar('render_deploy_id', { length: 100 }),
    status: deployStatusEnum('status').notNull().default(DeployStatus.Created),
    commitHash: varchar('commit_hash', { length: 40 }),
    buildLog: text('build_log'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('deployments_tenant_idx').on(t.tenantId, t.resourceId, t.createdAt)],
)

export const secrets = pgTable(
  'secrets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 200 }).notNull(),
    /** AES-256-GCM ciphertext: base64(iv).base64(authTag).base64(ciphertext). */
    encryptedValue: text('encrypted_value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('secrets_tenant_resource_key_idx').on(t.tenantId, t.resourceId, t.key)],
)

export const infraEvents = pgTable(
  'infra_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    resourceId: uuid('resource_id').references(() => resources.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('infra_events_tenant_idx').on(t.tenantId, t.createdAt)],
)
