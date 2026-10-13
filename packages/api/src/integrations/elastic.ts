import { elastic } from '../config/elastic.js'

export type TenantIndex = 'transactions' | 'agent-events' | 'audit-log'

/** The only way to build an index name — guarantees per-tenant isolation. */
export function tenantIndex(tenantId: string, index: TenantIndex): string {
  if (!tenantId) throw new Error('tenantIndex: tenantId is required')
  return `${tenantId.toLowerCase()}-${index}`
}

export async function indexDocument(
  tenantId: string,
  index: TenantIndex,
  document: Record<string, unknown>,
  id?: string,
): Promise<void> {
  await elastic.index({
    index: tenantIndex(tenantId, index),
    id,
    document: { ...document, tenantId },
  })
}

export async function searchDocuments<T>(
  tenantId: string,
  index: TenantIndex,
  query: Record<string, unknown> = { match_all: {} },
  size = 50,
): Promise<T[]> {
  const res = await elastic.search<T>({
    index: tenantIndex(tenantId, index),
    query,
    size,
  })
  return res.hits.hits.flatMap((hit) => (hit._source ? [hit._source] : []))
}

export async function ensureTenantIndices(tenantId: string): Promise<void> {
  const indices: TenantIndex[] = ['transactions', 'agent-events', 'audit-log']
  for (const index of indices) {
    const name = tenantIndex(tenantId, index)
    const exists = await elastic.indices.exists({ index: name })
    if (!exists) await elastic.indices.create({ index: name })
  }
}
