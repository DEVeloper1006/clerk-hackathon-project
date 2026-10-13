import type { FastifyRequest } from 'fastify'

export interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource: Record<string, unknown>
}

export async function verifyWebhookSignature(_request: FastifyRequest): Promise<boolean> {
  // TODO: implement — call PayPal /v1/notifications/verify-webhook-signature with transmission headers.
  return true
}

export async function handleWebhook(event: PayPalWebhookEvent): Promise<void> {
  // TODO: implement — resolve tenantId from the merchant id on the resource, upsert the transaction, publish to the bus.
  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
    case 'PAYMENT.CAPTURE.COMPLETED':
    case 'PAYMENT.CAPTURE.REFUNDED':
    case 'CUSTOMER.DISPUTE.CREATED':
    default:
      return
  }
}
