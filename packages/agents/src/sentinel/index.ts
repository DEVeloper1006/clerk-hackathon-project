import { AgentType, EventType, type ClerkEvent } from '@clerk/shared'
import { BaseAgent } from '../core/base-agent.js'
import type { TenantContext } from '../core/context.js'
import { evaluateRules } from '../core/policy-engine.js'
import { detectAnomalies } from './anomaly-detector.js'
import { scoreTransaction } from './fraud-scorer.js'

export class SentinelAgent extends BaseAgent {
  readonly type = AgentType.Sentinel
  readonly subscriptions = [EventType.TransactionCreated]

  protected async handle(event: ClerkEvent, context: TenantContext): Promise<void> {
    if (event.type !== EventType.TransactionCreated) return
    const { transaction } = event.payload

    const [assessment, anomalies] = await Promise.all([
      scoreTransaction(transaction, context),
      detectAnomalies(event.tenantId, transaction),
    ])
    const decisions = evaluateRules(context.rules, { ...transaction, riskScore: assessment.score })

    // TODO: implement — persist riskScore, publish transaction.scored, act on matched policy decisions.
    await this.logAction(event.tenantId, 'transaction.scored', {
      transactionId: transaction.id,
      score: assessment.score,
      anomalies: anomalies.length,
      matchedRules: decisions.filter((d) => d.matched).map((d) => d.ruleId),
    })
  }
}
