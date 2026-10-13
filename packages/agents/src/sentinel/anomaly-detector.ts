import type { Transaction } from '@clerk/shared'

export interface Anomaly {
  kind: 'amount_spike' | 'velocity' | 'new_geo' | 'other'
  description: string
}

export async function detectAnomalies(
  _tenantId: string,
  _transaction: Transaction,
): Promise<Anomaly[]> {
  // TODO: implement — compare against the tenant's historical baseline from ES {tenantId}-transactions.
  return []
}
