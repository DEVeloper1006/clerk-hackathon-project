import { AgentType, EventType, type ClerkEvent } from '@clerk/shared'
import { BaseAgent } from '../core/base-agent.js'
import type { TenantContext } from '../core/context.js'
import { mineRevenuePatterns } from './pattern-miner.js'

export class GrowthAgent extends BaseAgent {
  readonly type = AgentType.Growth
  readonly subscriptions = [EventType.TransactionCreated]

  protected async handle(event: ClerkEvent, _context: TenantContext): Promise<void> {
    // TODO: implement — batch/debounce per tenant instead of mining on every transaction; publish insight.generated.
    const patterns = await mineRevenuePatterns(event.tenantId)
    if (patterns.length === 0) return
    await this.logAction(event.tenantId, 'patterns.mined', { count: patterns.length })
  }
}
