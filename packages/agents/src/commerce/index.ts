import { AgentType, EventType, type ClerkEvent } from '@clerk/shared'
import { BaseAgent } from '../core/base-agent.js'
import type { TenantContext } from '../core/context.js'
import { resolveDispute } from './dispute-resolver.js'
import { decideRefund } from './refund-handler.js'

export class CommerceAgent extends BaseAgent {
  readonly type = AgentType.Commerce
  readonly subscriptions = [EventType.RefundRequested, EventType.DisputeOpened]

  protected async handle(event: ClerkEvent, context: TenantContext): Promise<void> {
    if (event.type === EventType.RefundRequested) {
      const decision = await decideRefund(event.tenantId, event.payload, context)
      await this.logAction(event.tenantId, 'refund.decided', {
        transactionId: event.payload.transactionId,
        decision,
      })
    } else if (event.type === EventType.DisputeOpened) {
      const response = await resolveDispute(event.tenantId, event.payload, context)
      await this.logAction(event.tenantId, 'dispute.handled', {
        disputeId: event.payload.disputeId,
        action: response.action,
      })
    }
  }
}
