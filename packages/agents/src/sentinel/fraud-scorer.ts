import type { Transaction } from '@clerk/shared'
import type { TenantContext } from '../core/context.js'

export interface RiskAssessment {
  score: number
  reasons: string[]
}

export async function scoreTransaction(
  _transaction: Transaction,
  _context: TenantContext,
): Promise<RiskAssessment> {
  // TODO: implement — combine heuristic signals (amount, velocity, geo mismatch) with an LLM explanation into a 0–100 score.
  return { score: 0, reasons: [] }
}
