import type { Transaction } from '@clerk/shared'

export interface ListTransactionsQuery {
  q?: string
  limit: number
  offset: number
}

export async function listTransactions(
  _tenantId: string,
  _query: ListTransactionsQuery,
): Promise<Transaction[]> {
  // TODO: implement — query Postgres (or ES {tenantId}-transactions when q is set) scoped by tenant.
  return []
}

export async function getTransaction(
  _tenantId: string,
  _transactionId: string,
): Promise<Transaction | null> {
  // TODO: implement — select transaction where id = transactionId and tenant_id = tenantId.
  return null
}
