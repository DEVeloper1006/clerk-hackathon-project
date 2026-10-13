import { api } from './api'

/** Starts the PayPal OAuth connect flow for the current tenant. */
export async function startPayPalConnect(): Promise<void> {
  // TODO: implement — fetch the connect URL from the API and redirect; handle the null (unconfigured) case in the UI.
  const res = await api<{ url: string | null }>('/api/paypal/connect')
  if (res.success && res.data?.url) window.location.assign(res.data.url)
}

export async function loadPayPalButtons(): Promise<void> {
  // TODO: implement — load the PayPal JS SDK script with the sandbox client id for demo checkouts.
}
