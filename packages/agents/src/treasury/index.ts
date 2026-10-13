import { AgentType, EventType, type ClerkEvent } from '@clerk/shared'
import { BaseAgent } from '../core/base-agent.js'
import type { TenantContext } from '../core/context.js'
import { forecastCashFlow } from './forecaster.js'
import { planPayments } from './scheduler.js'

const DEFAULT_HORIZON_DAYS = 30

export class TreasuryAgent extends BaseAgent {
  readonly type = AgentType.Treasury
  readonly subscriptions = [EventType.TransactionUpdated, EventType.PayoutScheduled]

  protected async handle(event: ClerkEvent, _context: TenantContext): Promise<void> {
    // TODO: implement — recompute forecast on money movement, publish forecast.updated, propose payout schedule.
    const forecast = await forecastCashFlow(event.tenantId, DEFAULT_HORIZON_DAYS)
    const payments = await planPayments(event.tenantId, forecast)
    await this.logAction(event.tenantId, 'forecast.recomputed', {
      trigger: event.type,
      points: forecast.length,
      plannedPayments: payments.length,
    })
  }
}
