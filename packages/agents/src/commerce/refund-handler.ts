import type { EventPayloads, EventType } from '@clerk/shared'
import type { TenantContext } from '../core/context.js'

export type RefundDecision = 'approve' | 'deny' | 'escalate'

export async function decideRefund(
  _tenantId: string,
  _request: EventPayloads[EventType.RefundRequested],
  _context: TenantContext,
): Promise<RefundDecision> {
  // TODO: implement — apply tenant refund rules, then issue the refund via PayPal when approved.
  return 'escalate'
}
