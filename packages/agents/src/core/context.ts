import pg from 'pg'
import type { AgentType, Rule, Tenant } from '@clerk/shared'
import { env } from '../config/env.js'

// Lazy pool: no connection until the first query.
const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
pool.on('error', (err) => console.error('[context] pool error:', err.message))

export interface TenantContext {
  tenant: Tenant | null
  agentConfig: Record<string, unknown>
  rules: Rule[]
}

const CACHE_TTL_MS = 30_000
const cache = new Map<string, { at: number; value: TenantContext }>()

/** Loads the tenant, this agent's config, and its active rules. Always scoped by tenant_id. */
export async function loadTenantContext(
  tenantId: string,
  agentType: AgentType,
): Promise<TenantContext> {
  const key = `${tenantId}:${agentType}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value

  // TODO: implement — select tenant by id, agent config where tenant_id + type, enabled rules where tenant_id + agent_type.
  const value: TenantContext = { tenant: null, agentConfig: {}, rules: [] }
  cache.set(key, { at: Date.now(), value })
  return value
}

/** Drop cached context for a tenant (e.g. on rule.updated). */
export function invalidateTenantContext(tenantId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${tenantId}:`)) cache.delete(key)
  }
}

export async function closeContextPool(): Promise<void> {
  await pool.end()
}
