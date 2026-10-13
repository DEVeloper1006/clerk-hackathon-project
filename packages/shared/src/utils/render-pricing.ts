import { ResourceType, type ResourceConfig } from '../types/resources.js'

/**
 * Render list prices in cents per month, by resource type and plan.
 * Source: render.com/pricing — verify before relying on these for billing.
 * Cron jobs are billed per minute of runtime; the value here is the monthly minimum.
 */
export const RENDER_PLAN_PRICES_CENTS: Record<ResourceType, Record<string, number>> = {
  [ResourceType.WebService]: {
    free: 0,
    starter: 700,
    standard: 2500,
    pro: 8500,
    pro_plus: 17500,
    pro_max: 22500,
    pro_ultra: 45000,
  },
  [ResourceType.Worker]: {
    starter: 700,
    standard: 2500,
    pro: 8500,
    pro_plus: 17500,
    pro_max: 22500,
    pro_ultra: 45000,
  },
  [ResourceType.CronJob]: {
    starter: 100,
    standard: 100,
    pro: 100,
  },
  [ResourceType.Postgres]: {
    free: 0,
    basic_256mb: 600,
    basic_1gb: 1900,
    basic_4gb: 7500,
    pro_4gb: 5500,
    pro_8gb: 10000,
  },
  [ResourceType.KeyValue]: {
    free: 0,
    starter: 1000,
    standard: 3200,
    pro: 13500,
  },
  [ResourceType.StaticSite]: {
    free: 0,
  },
}

/** Plan used when a resource doesn't specify one. */
export const DEFAULT_RENDER_PLAN: Record<ResourceType, string> = {
  [ResourceType.WebService]: 'starter',
  [ResourceType.Worker]: 'starter',
  [ResourceType.CronJob]: 'starter',
  [ResourceType.Postgres]: 'basic_256mb',
  [ResourceType.KeyValue]: 'starter',
  [ResourceType.StaticSite]: 'free',
}

/** Monthly list price for a resource. Unknown plans fall back to the type's default plan. */
export function renderMonthlyCostCents(type: ResourceType, config: ResourceConfig = {}): number {
  const prices = RENDER_PLAN_PRICES_CENTS[type]
  const plan = config.plan?.toLowerCase().replace(/[\s-]/g, '_') ?? DEFAULT_RENDER_PLAN[type]
  return prices[plan] ?? prices[DEFAULT_RENDER_PLAN[type]] ?? 0
}
