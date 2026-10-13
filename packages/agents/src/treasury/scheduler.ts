export interface ScheduledPayment {
  id: string
  amount: number
  currency: string
  scheduledFor: string
}

export async function planPayments(
  _tenantId: string,
  _forecast: { date: string; projectedBalance: number }[],
): Promise<ScheduledPayment[]> {
  // TODO: implement — choose payout dates that keep projected balance above the tenant's safety threshold.
  return []
}
