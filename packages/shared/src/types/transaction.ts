export type TransactionStatus =
  'created' | 'approved' | 'completed' | 'refunded' | 'disputed' | 'flagged' | 'failed'

export interface Transaction {
  id: string
  tenantId: string
  paypalOrderId: string
  amount: number
  currency: string
  status: TransactionStatus
  /** 0–100, set by the Sentinel agent. Null until scored. */
  riskScore: number | null
  createdAt: string
}
