import { env } from '../config/env.js'

export type ZapierTrigger = 'slack_alert' | 'email_receipt' | 'crm_sync'

export async function triggerZap(
  tenantId: string,
  trigger: ZapierTrigger,
  data: Record<string, unknown>,
): Promise<{ sent: boolean }> {
  // TODO: implement — POST { tenantId, trigger, data } to the tenant's Zapier webhook (per-tenant URL from tenant settings, falling back to env).
  if (!env.ZAPIER_WEBHOOK_URL) return { sent: false }
  void tenantId
  void trigger
  void data
  return { sent: false }
}
