export interface ForecastPoint {
  date: string
  projectedBalance: number
}

export async function forecastCashFlow(
  _tenantId: string,
  _horizonDays: number,
): Promise<ForecastPoint[]> {
  // TODO: implement — project balance from historical inflows/outflows plus scheduled payouts.
  return []
}
