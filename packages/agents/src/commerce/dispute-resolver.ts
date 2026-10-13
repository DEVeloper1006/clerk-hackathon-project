import type { EventPayloads, EventType } from '@clerk/shared'
import type { TenantContext } from '../core/context.js'

export interface DisputeResponse {
  action: 'accept' | 'contest' | 'escalate'
  evidence: string[]
}

export async function resolveDispute(
  _tenantId: string,
  _dispute: EventPayloads[EventType.DisputeOpened],
  _context: TenantContext,
): Promise<DisputeResponse> {
  // TODO: implement — gather order evidence, draft a response with the LLM, submit via PayPal Disputes API.
  return { action: 'escalate', evidence: [] }
}
