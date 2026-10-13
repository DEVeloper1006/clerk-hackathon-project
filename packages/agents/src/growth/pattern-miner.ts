export interface RevenuePattern {
  title: string
  summary: string
  confidence: number
}

export async function mineRevenuePatterns(_tenantId: string): Promise<RevenuePattern[]> {
  // TODO: implement — aggregate {tenantId}-transactions in ES (by day/product/customer) and summarize with the LLM.
  return []
}
