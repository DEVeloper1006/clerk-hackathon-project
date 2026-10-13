import { env } from '../../config/env.js'

export function buildConnectUrl(tenantId: string): string | null {
  // TODO: implement — build the PayPal Connect (Log in with PayPal / partner referral) URL with state=tenantId.
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_REDIRECT_URI) return null
  void tenantId
  return null
}

export async function exchangeCode(_tenantId: string, _code: string): Promise<boolean> {
  // TODO: implement — exchange the OAuth code for tokens, store merchant id, set paypalConnected=true.
  return false
}

export async function getAccessToken(): Promise<string | null> {
  // TODO: implement — client-credentials token from env.PAYPAL_API_BASE/v1/oauth2/token, cached until expiry.
  return null
}

export async function listOrders(_tenantId: string): Promise<unknown[]> {
  // TODO: implement — call PayPal Orders API on behalf of the tenant's merchant.
  return []
}

export async function createPayout(
  _tenantId: string,
  _amount: number,
  _currency: string,
  _receiver: string,
): Promise<string | null> {
  // TODO: implement — call PayPal Payouts API; return payout batch id.
  return null
}
