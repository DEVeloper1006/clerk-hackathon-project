import { env } from '../config/env.js'

export interface ProductInsight {
  productId: string
  title: string
  marketPrice: number
  currency: string
}

export async function lookupProducts(_tenantId: string, _query: string): Promise<ProductInsight[]> {
  // TODO: implement — install @channel3/sdk and query the catalog for comparable products and suppliers.
  if (!env.CHANNEL3_API_KEY) return []
  return []
}
